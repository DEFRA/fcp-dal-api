export function transformAuthenticateQuestionsAnswers (questionAnswers = {}) {
  return {
    memorableDate: questionAnswers?.Date,
    memorableEvent: questionAnswers?.Event,
    memorablePlace: questionAnswers?.Location
  }
}
