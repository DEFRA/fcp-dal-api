import { loggerOptions } from './logger-options'

describe('logger-options', () => {
  const censor = loggerOptions.redact.censor

  it('should censor certain paths with "<empty>" when no value is configured', () => {
    expect(censor('', ['kitsConnection', 'key'])).toEqual('<empty>')
    expect(censor('', ['kitsConnection', 'cert'])).toEqual('<empty>')
    expect(censor('', ['req', 'headers', 'authorization'])).toEqual('<empty>')
  })

  it('should censor same paths with "[REDACTED]" when a value is configured', () => {
    expect(censor('something secret', ['kitsConnection', 'key'])).toEqual(
      '[REDACTED]'
    )
    expect(censor('something secret', ['kitsConnection', 'cert'])).toEqual(
      '[REDACTED]'
    )
    expect(
      censor('something secret', ['req', 'headers', 'authorization'])
    ).toEqual('[REDACTED]')
  })

  it('should censor certain paths with "<truncated>"', () => {
    expect(censor('', ['req', 'headers', 'cookie'])).toEqual('<truncated>')
    expect(censor('', ['res', 'headers'])).toEqual('<truncated>')
    expect(
      censor({ header: 'something long' }, ['req', 'headers', 'cookie'])
    ).toEqual('<truncated>')
    expect(censor({ cookie: 'something long' }, ['res', 'headers'])).toEqual(
      '<truncated>'
    )
  })

  it('should otherwise censor all other matching paths with "[REDACTED]"', () => {
    expect(censor('', ['any', 'old', 'path'])).toEqual('[REDACTED]')
    expect(censor('something secret', ['any', 'old', 'path'])).toEqual(
      '[REDACTED]'
    )
  })
})
