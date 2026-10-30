import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export interface GoogleLinkValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  placeId?: string;
  error?: string;
}

const ALLOWED_GOOGLE_HOSTS = new Set([
  'search.google.com',
  'www.google.com',
  'google.com',
  'maps.google.com',
  'g.page',
  'maps.app.goo.gl',
  'goo.gl',
  'www.google.co.in',
  'google.co.in',
]);

/**
 * Validates and normalizes various forms of Google Review links and Place IDs.
 */
export function validateAndNormalizeGoogleReviewLink(
  rawInput: string,
): GoogleLinkValidationResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      isValid: false,
      error: 'Google review link or Place ID cannot be empty',
    };
  }

  const trimmed = rawInput.trim();

  // 1. Raw Google Place ID check (e.g. starts with ChIJ and has 15-40 chars)
  const placeIdRegex = /^ChIJ[a-zA-Z0-9_-]{15,40}$/;
  if (placeIdRegex.test(trimmed)) {
    return {
      isValid: true,
      placeId: trimmed,
      normalizedUrl: `https://search.google.com/local/writereview?placeid=${trimmed}`,
    };
  }

  // Parse as URL
  let parsedUrl: URL;
  try {
    const withProto = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
    parsedUrl = new URL(withProto);
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format or Place ID',
    };
  }

  // Enforce HTTPS strictly
  if (parsedUrl.protocol !== 'https:') {
    return {
      isValid: false,
      error: 'Google review link must use secure HTTPS protocol',
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  // Strict domain allowlist validation (eliminates evil-google.com, google.attacker.com)
  if (!ALLOWED_GOOGLE_HOSTS.has(hostname) && !hostname.endsWith('.g.page')) {
    return {
      isValid: false,
      error: 'URL host must belong to an official Google domain (search.google.com, g.page, goo.gl, etc.)',
    };
  }

  // 2. Direct search.google.com writereview / reviews
  if (
    hostname === 'search.google.com' ||
    hostname === 'www.google.com' ||
    hostname === 'google.com' ||
    hostname === 'www.google.co.in' ||
    hostname === 'google.co.in'
  ) {
    const placeIdParam = searchParams.get('placeid');
    if (placeIdParam && /^[a-zA-Z0-9_-]{10,60}$/.test(placeIdParam.trim())) {
      return {
        isValid: true,
        placeId: placeIdParam.trim(),
        normalizedUrl: `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeIdParam.trim())}`,
      };
    }

    const qParam = searchParams.get('q');
    if (qParam && qParam.startsWith('place_id:')) {
      const extractedPlaceId = qParam.replace('place_id:', '').trim();
      if (/^[a-zA-Z0-9_-]{10,60}$/.test(extractedPlaceId)) {
        return {
          isValid: true,
          placeId: extractedPlaceId,
          normalizedUrl: `https://search.google.com/local/writereview?placeid=${encodeURIComponent(extractedPlaceId)}`,
        };
      }
    }
  }

  // 3. Google Business Profile shortlink (g.page/r/...)
  if (hostname === 'g.page' || hostname.endsWith('.g.page')) {
    if (pathname.startsWith('/r/') && pathname.length > 5) {
      let cleanPath = pathname;
      if (!cleanPath.endsWith('/review')) {
        cleanPath = `${cleanPath.replace(/\/+$/, '')}/review`;
      }
      return {
        isValid: true,
        normalizedUrl: `https://g.page${cleanPath}`,
      };
    }
    return {
      isValid: false,
      error: 'Google Business Profile link must follow format https://g.page/r/.../review',
    };
  }

  // 4. Short Maps links (maps.app.goo.gl or goo.gl)
  if (hostname === 'maps.app.goo.gl' || hostname === 'goo.gl') {
    if (pathname.length > 3 && pathname !== '/') {
      return {
        isValid: true,
        normalizedUrl: `https://${hostname}${pathname}${parsedUrl.search}`,
      };
    }
    return {
      isValid: false,
      error: 'Generic Google Maps link without place identifier is not supported',
    };
  }

  // 5. Development-only placeholder (strictly disabled in production)
  if (
    process.env.NODE_ENV !== 'production' &&
    trimmed === 'https://search.google.com/local/writereview?placeid=test'
  ) {
    return {
      isValid: true,
      normalizedUrl: trimmed,
      placeId: 'test',
    };
  }

  return {
    isValid: false,
    error:
      'Must be a valid Google Review link (e.g. https://search.google.com/local/writereview?placeid=... or https://g.page/r/.../review) or a Google Place ID starting with ChIJ',
  };
}

/**
 * Class-validator decorator for Google Review link validation
 */
export function IsGoogleReviewLink(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isGoogleReviewLink',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (!value && validationOptions?.each) return true;
          if (value === undefined || value === null) return true;
          return validateAndNormalizeGoogleReviewLink(String(value)).isValid;
        },
        defaultMessage(_args: ValidationArguments) {
          return 'Invalid Google review link. Please provide a direct review link (e.g. search.google.com/local/writereview?placeid=... or g.page/r/.../review) or a Place ID.';
        },
      },
    });
  };
}
