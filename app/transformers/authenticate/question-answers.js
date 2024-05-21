export function transformAuthenticateQuestionsAnswers (questionAnswers) {
  return {
    memorableDate: questionAnswers?.Date !== '' ? questionAnswers?.Date : null,
    memorableEvent: questionAnswers?.Event !== '' ? questionAnswers?.Event : null,
    memorablePlace: questionAnswers?.Location !== '' ? questionAnswers?.Location : null,
    updatedAt: questionAnswers?.Updated !== '' ? questionAnswers?.Updated : null,
    isFound: questionAnswers !== null
  }
}
