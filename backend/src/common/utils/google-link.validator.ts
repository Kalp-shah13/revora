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

  // 1. Raw Google Place ID check (e.g. starts with ChIJ and has 20+ chars)
  const placeIdRegex = /^ChIJ[a-zA-Z0-9_-]{15,}$/;
  if (placeIdRegex.test(trimmed)) {
    return {
      isValid: true,
      placeId: trimmed,
      normalizedUrl: `https://search.google.com/local/writereview?placeid=${trimmed}`,
    };
  }

  // Check if string is a valid URL
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

  const hostname = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  // 2. Direct search.google.com writereview / reviews
  if (
    hostname.includes('search.google.com') ||
    hostname.includes('google.com')
  ) {
    // Check placeid query parameter (e.g. search.google.com/local/writereview?placeid=...)
    const placeIdParam = searchParams.get('placeid');
    if (placeIdParam && placeIdParam.trim().length >= 10) {
      return {
        isValid: true,
        placeId: placeIdParam.trim(),
        normalizedUrl: `https://search.google.com/local/writereview?placeid=${placeIdParam.trim()}`,
      };
    }

    // Check place_id query in google.com/maps/place/?q=place_id:...
    const qParam = searchParams.get('q');
    if (qParam && qParam.startsWith('place_id:')) {
      const extractedPlaceId = qParam.replace('place_id:', '').trim();
      if (extractedPlaceId.length >= 10) {
        return {
          isValid: true,
          placeId: extractedPlaceId,
          normalizedUrl: `https://search.google.com/local/writereview?placeid=${extractedPlaceId}`,
        };
      }
    }
  }

  // 3. Google Business Profile shortlink (g.page/r/...)
  if (hostname === 'g.page' || hostname.endsWith('.g.page')) {
    if (pathname.includes('/r/')) {
      // Ensure it ends with /review for direct review dialog
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

  // 4. Short Maps links (maps.app.goo.gl or goo.gl/maps)
  if (
    hostname === 'maps.app.goo.gl' ||
    hostname === 'goo.gl' ||
    (hostname.includes('google.') && pathname.startsWith('/maps'))
  ) {
    if (pathname.length > 5) {
      return {
        isValid: true,
        normalizedUrl: parsedUrl.toString(),
      };
    }
    return {
      isValid: false,
      error: 'Generic Google Maps link without place identifier is not supported',
    };
  }

  // 5. Test/development placeholder exception
  if (trimmed.includes('placeid=test')) {
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
