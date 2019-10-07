export function modInput (input) {
  if (input === "test text") {
    return {
      'text': input,
      'statement': "Default text"
    }
  }else {
    return {
      'text': input,
      'statement': "New text."
    } 
  }
}
