const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/
const INTERNAL_EMAIL_DOMAIN = 'grader.internal'

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username)
}

export function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@${INTERNAL_EMAIL_DOMAIN}`
}

export function usernameValidationMessage(): string {
  return 'Username must be 3–20 characters and contain only letters, numbers, or underscores.'
}
