import { getClientIp, getEndUserIpAddress } from '../../../app/audit/audit-ip.js'

const request = (xForwardedFor, remoteAddress = '10.0.0.1') => ({
  headers: xForwardedFor === undefined ? {} : { 'x-forwarded-for': xForwardedFor },
  info: { remoteAddress }
})

describe('audit-ip', () => {
  describe('getClientIp', () => {
    test('returns null when the header is undefined', () => {
      expect(getClientIp(undefined)).toBeNull()
    })

    test('returns null when the header is an empty string', () => {
      expect(getClientIp('')).toBeNull()
    })

    test('returns a single IP unchanged', () => {
      expect(getClientIp('203.0.113.5')).toBe('203.0.113.5')
    })

    test('returns the first IP of a comma-separated chain', () => {
      expect(getClientIp('203.0.113.5, 70.41.3.18, 150.172.238.178')).toBe('203.0.113.5')
    })

    test('trims whitespace around the first IP', () => {
      expect(getClientIp('  203.0.113.5  ,70.41.3.18')).toBe('203.0.113.5')
    })

    test('takes the first element when the header is an array', () => {
      expect(getClientIp(['203.0.113.5', '70.41.3.18'])).toBe('203.0.113.5')
    })

    test('applies comma-splitting to the first element of an array', () => {
      expect(getClientIp(['203.0.113.5, 70.41.3.18'])).toBe('203.0.113.5')
    })
  })

  describe('getEndUserIpAddress', () => {
    test('uses the x-forwarded-for header when present', () => {
      expect(getEndUserIpAddress(request('203.0.113.5'))).toBe('203.0.113.5')
    })

    test('takes the first IP when x-forwarded-for is a chain', () => {
      expect(getEndUserIpAddress(request('203.0.113.5, 70.41.3.18'))).toBe('203.0.113.5')
    })

    test('falls back to request.info.remoteAddress when x-forwarded-for is absent', () => {
      expect(getEndUserIpAddress(request(undefined, '198.51.100.7'))).toBe('198.51.100.7')
    })

    test('falls back to request.info.remoteAddress when x-forwarded-for is an empty string', () => {
      expect(getEndUserIpAddress(request('', '198.51.100.7'))).toBe('198.51.100.7')
    })

    test('returns an empty string when neither source yields an address', () => {
      expect(getEndUserIpAddress(request(undefined, ''))).toBe('')
    })

    test('strips an IPv6 zone id', () => {
      expect(getEndUserIpAddress(request('fe80::1%eth0'))).toBe('fe80::1')
    })

    test('strips a trailing :port from an IPv4 address', () => {
      expect(getEndUserIpAddress(request('192.168.1.1:8080'))).toBe('192.168.1.1')
    })

    test('does not strip a bare IPv6 address (more than one colon)', () => {
      expect(getEndUserIpAddress(request('fe80::1'))).toBe('fe80::1')
    })

    test('truncates a long IPv6 address to the 20-char schema limit', () => {
      const longIpv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
      expect(getEndUserIpAddress(request(longIpv6))).toBe('2001:0db8:85a3:0000:')
      expect(getEndUserIpAddress(request(longIpv6)).length).toBe(20)
    })

    test('does not truncate an IPv4 address (always within the 20-char limit)', () => {
      expect(getEndUserIpAddress(request('255.255.255.255'))).toBe('255.255.255.255')
    })
  })
})
