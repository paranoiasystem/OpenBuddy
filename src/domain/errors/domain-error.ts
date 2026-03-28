/**
 * Abstract base class for all domain errors.
 * Every error subclass must provide a unique `code` discriminant.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string

  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
