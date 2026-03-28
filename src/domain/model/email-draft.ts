/** An email draft value object ready to be sent via Gmail. */
export type EmailDraft = {
  readonly to: ReadonlyArray<string>
  readonly subject: string
  readonly body: string
  readonly cc?: ReadonlyArray<string>
}
