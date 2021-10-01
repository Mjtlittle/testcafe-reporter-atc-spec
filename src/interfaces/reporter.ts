import type { CallsiteRecord } from 'callsite-record'
import type { Chalk } from 'chalk'
import type { Moment } from 'moment'

export interface TaskResult {
  passedCount: number
  failedCount: number
  skippedCount: number
}

export interface Reporter {
  // settings
  noColors?: boolean

  // reporter functions
  reportTaskStart(
    startTime: Date,
    userAgents: string[],
    test_count: number
  ): void
  reportFixtureStart(name: string, path: string, meta: any): void
  reportTestStart?(name: string, meta: any): void
  reportTestDone(name: string, info: TestRunInfo, meta: any): void
  reportTaskDone(
    end_time: Date,
    passed: number,
    warnings: any[],
    result: TaskResult
  ): void
}

export interface TestResult {
  index: number
  name: string
  info: TestRunInfo
  meta: any
}

export interface ReporterContext extends Reporter {
  // helper libraries
  chalk: Chalk
  moment: Moment

  // helper functions
  newline(): this
  write(text: string): this
  useWordWrap(use: boolean): this
  setIndent(indent: number): this
  indentString(text: string, indent: number): string
  wordWrap(text: string): string
  escapeHtml(text: string): string
  formatError(error: any, prefix: string): string
}

export interface TestRunInfo {
  browsers: BrowserInfo[]
  durationMs: number
  errs: CallsiteError[]
  screenshotPath: string | null
  screenshots: Screenshot[]
  skipped: boolean
  videos: unknown[]
  warnings: string[]
  unstable: boolean
  quarantine?: { [index: string]: QuarantineInfo }
}

export interface QuarantineInfo {
  passed: boolean
}

export interface BrowserInfo {
  alias: string
  engine: unknown
  headless: boolean
  name: string
  os: unknown
  platform: string
  prettyUserAgent: string
  testRunId: string
  userAgent: string
  version: string
}

export interface Screenshot {
  screenshotPath: string
  thumbnailPath: string
  userAgent: string
  quarantineAttempt: number | null
  takenOnFail: boolean
  testRunId: string
}

export interface CallsiteError {
  formatMessage(errs: CallsiteError[]): string
  getErrorMarkup(): Function
  apiFnChain: string[]
  callsite: CallsiteInterface
  code: string
  errMsg: string
  isTestCafeError: boolean
  originError: string
  screenshotPath: string
  testRunId: string
  testRunPhase: string
  type: TestCafeErrorType
  userAgent: string
}

export interface CallsiteInterface extends CallsiteRecord {
  filename: string
  lineNum: number
  stackFrames: StackFrame[]
  callsiteFrameIdx: number
  isV8Frames: boolean
}

export interface StackFrame {
  getFileName: () => string
  getLineNumber: () => number
  getColumnNumber: () => number
  fileName: string
  lineNumber: number
  columnNumber: number
  source: string
  functionName?: string
}

export type TestCafeErrorType =
  | 'actionAdditionalElementIsInvisibleError'
  | 'actionAdditionalElementNotFoundError'
  | 'actionAdditionalSelectorMatchesWrongNodeTypeError'
  | 'actionBooleanOptionError'
  | 'actionCanNotFindFileToUploadError'
  | 'actionElementIsInvisibleError'
  | 'actionElementIsNotFileInputError'
  | 'actionElementNonContentEditableError'
  | 'actionElementNonEditableError'
  | 'actionElementNotFoundError'
  | 'actionElementNotIframeError'
  | 'actionElementNotTextAreaError'
  | 'actionIframeIsNotLoadedError'
  | 'actionIncorrectKeysError'
  | 'actionIntegerArgumentError'
  | 'actionIntegerOptionError'
  | 'actionInvalidScrollTargetError'
  | 'actionNullableStringArgumentError'
  | 'actionOptionsTypeError'
  | 'actionPositiveIntegerArgumentError'
  | 'actionPositiveIntegerOptionError'
  | 'actionRoleArgumentError'
  | 'actionRootContainerNotFoundError'
  | 'actionSelectorError'
  | 'actionSelectorMatchesWrongNodeTypeError'
  | 'actionSpeedOptionError'
  | 'actionStringArgumentError'
  | 'actionStringArrayElementError'
  | 'actionStringOrStringArrayArgumentError'
  | 'actionUnsupportedDeviceTypeError'
  | 'assertionExecutableArgumentError'
  | 'cantObtainInfoForElementSpecifiedBySelectorError'
  | 'clientFunctionExecutionInterruptionError'
  | 'currentIframeIsInvisibleError'
  | 'currentIframeIsNotLoadedError'
  | 'currentIframeNotFoundError'
  | 'domNodeClientFunctionResultError'
  | 'externalAssertionLibraryError'
  | 'invalidElementScreenshotDimensionsError'
  | 'invalidSelectorResultError'
  | 'missingAwaitError'
  | 'nativeDialogNotHandledError'
  | 'pageLoadError'
  | 'roleSwitchInRoleInitializerError'
  | 'setNativeDialogHandlerCodeWrongTypeError'
  | 'setTestSpeedArgumentError'
  | 'uncaughtErrorInClientFunctionCode'
  | 'uncaughtErrorInCustomDOMPropertyCode'
  | 'uncaughtErrorInNativeDialogHandler'
  | 'uncaughtErrorInTestCode'
  | 'uncaughtErrorOnPage'
  | 'uncaughtNonErrorObjectInTestCode'
  | 'windowDimensionsOverflowError'
