import {
  TestRunInfo,
  Reporter,
  TestResult,
  ReporterContext,
} from './interfaces/reporter'
import {
  log_current_time,
  log_error,
  log_fixture,
  log_header,
  log_jira_error,
  log_results,
  log_test_run,
  log_user_agents,
} from './logging'
import {
  report_jira_execution,
  report_jira_results,
  validate_jira,
} from './jira'

let start_time: Date
let end_time: Date
let test_index: number = 0
let test_results: TestResult[] = []

export default (): Reporter => ({
  noColors: false,

  async reportTaskStart(time, user_agents, test_count) {
    const ctx = this as ReporterContext
    start_time = time

    log_header(ctx, 'Configuration')
    log_current_time(ctx)
    log_user_agents(ctx, user_agents)

    log_header(ctx, 'Test Execution')
  },

  async reportFixtureStart(name, path, meta) {
    const ctx = this as ReporterContext

    log_fixture(ctx, name)
  },

  async reportTestDone(name, info, meta) {
    const ctx = this as ReporterContext
    test_index++
    log_test_run(ctx, test_index, name, info, meta)

    // log errors
    if (info.errs.length > 0) log_error(ctx, info.errs)

    // log the test result
    test_results.push({ index: test_index, name, info, meta })
  },

  async reportTaskDone(time, passed, warnings, result) {
    const ctx = this as ReporterContext
    end_time = time

    // ! add at a future date, moving the errors and warnings down to here
    // log_header(ctx, 'Problems')

    log_header(ctx, 'Results')
    log_results(ctx, start_time, end_time, result)

    // if jira test is valid
    log_header(ctx, 'Jira Reporting')
    if (await validate_jira(ctx)) {
      await report_jira_results(ctx, start_time, end_time, test_results)
    } else {
      log_jira_error(ctx, 'No test execution tickets will be made')
    }

    log_header(ctx, 'End')
    ctx.newline()
  },
})

module.exports = exports.default
