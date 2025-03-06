export function transformAuthenticateQuestionsAnswers(questionAnswers) {
  return {
    memorableDate: questionAnswers?.memorableDate,
    memorableEvent: questionAnswers?.memorableEvent,
    memorableLocation: questionAnswers?.memorableLocation,
    updatedAt: questionAnswers?.lastUpdatedOn,
    isFound: questionAnswers !== null
  }
}
