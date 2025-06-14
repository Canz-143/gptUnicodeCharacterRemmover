/**
 * Validates the API input
 * @param {Object} body - Request body
 * @returns {Object} Validation result with isValid flag, error message if any, and the text
 */
export function validateInput(body) {
  // Check if body exists
  if (!body) {
    return {
      isValid: false,
      error: 'Request body is required',
    };
  }
  
  // Check if text field exists
  if (body.text === undefined) {
    return {
      isValid: false,
      error: 'The "text" field is required in the request body',
    };
  }
  
  // Check if text is a string
  if (typeof body.text !== 'string') {
    return {
      isValid: false,
      error: 'The "text" field must be a string',
    };
  }
  
  // Return valid result with the text
  return {
    isValid: true,
    text: body.text,
  };
}