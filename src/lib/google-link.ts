export interface GoogleLinkValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  placeId?: string;
  kind?: 'place_id' | 'shortlink' | 'direct_url' | 'maps_link' | 'test';
  error?: string;
}

/**
 * Validates and normalizes various forms of Google Review links and Place IDs on the client side.
 */
export function validateGoogleReviewLink(rawInput: string): GoogleLinkValidationResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      isValid: false,
      error: 'Google review link or Place ID cannot be empty',
    };
  }

  const trimmed = rawInput.trim();

  // 1. Raw Google Place ID check (e.g. starts with ChIJ and has 15+ chars)
  const placeIdRegex = /^ChIJ[a-zA-Z0-9_-]{15,}$/;
  if (placeIdRegex.test(trimmed)) {
    return {
      isValid: true,
      kind: 'place_id',
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

  const hostname = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  // 2. Direct search.google.com writereview / reviews
  if (
    hostname.includes('search.google.com') ||
    hostname.includes('google.com')
  ) {
    const placeIdParam = searchParams.get('placeid');
    if (placeIdParam && placeIdParam.trim().length >= 10) {
      return {
        isValid: true,
        kind: 'direct_url',
        placeId: placeIdParam.trim(),
        normalizedUrl: `https://search.google.com/local/writereview?placeid=${placeIdParam.trim()}`,
      };
    }

    const qParam = searchParams.get('q');
    if (qParam && qParam.startsWith('place_id:')) {
      const extractedPlaceId = qParam.replace('place_id:', '').trim();
      if (extractedPlaceId.length >= 10) {
        return {
          isValid: true,
          kind: 'direct_url',
          placeId: extractedPlaceId,
          normalizedUrl: `https://search.google.com/local/writereview?placeid=${extractedPlaceId}`,
        };
      }
    }
  }

  // 3. Google Business Profile shortlink (g.page/r/...)
  if (hostname === 'g.page' || hostname.endsWith('.g.page')) {
    if (pathname.includes('/r/')) {
      let cleanPath = pathname;
      if (!cleanPath.endsWith('/review')) {
        cleanPath = `${cleanPath.replace(/\/+$/, '')}/review`;
      }
      return {
        isValid: true,
        kind: 'shortlink',
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
        kind: 'maps_link',
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
      kind: 'test',
      normalizedUrl: trimmed,
      placeId: 'test',
    };
  }

  return {
    isValid: false,
    error:
      'Must be a valid Google Review link (e.g. search.google.com/local/writereview?placeid=... or g.page/r/.../review) or a Google Place ID starting with ChIJ',
  };
}
