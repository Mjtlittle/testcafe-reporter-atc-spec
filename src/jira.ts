import {
  Reporter,
  ReporterContext,
  TestResult,
  TestRunInfo,
} from './interfaces/reporter'
import { log_jira, log_jira_error } from './logging'
import fetch from 'node-fetch'
// import formatISO from 'date-fns/formatISO'
import { formatISO } from 'date-fns'

export const jira_server =
  process.env.JIRA_URL || 'https://atc.bmwgroup.net/jira'
const jira_username = process.env.JIRA_USERNAME
const jira_password = process.env.JIRA_PASSWORD

const jira_issue_regex = /^[A-Z]+-\d+$/
const is_valid_jira_key = (key: string) => jira_issue_regex.test(key)
const is_valid_jira_meta = (meta: any) =>
  meta.hasOwnProperty('jiraTestKey') && // has prop
  typeof meta.jiraTestKey === 'string' && // is string
  is_valid_jira_key(meta.jiraTestKey) // matches regex

const jira_auth = Buffer.from(`${jira_username}:${jira_password}`) //
  .toString('base64')
const jira_fetch = (path: string, config: any = {}) =>
  fetch(`${jira_server}/${path}`, {
    method: 'GET',
    ...config,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${jira_auth}`,
      ...config.headers,
    },
  })

const status_from_info = (info: TestRunInfo): string => {
  if (info.skipped) return 'TODO'
  else if (info.errs.length > 0) return 'FAIL'
  else if (info.errs.length === 0) return 'PASS'
  return '' //
}

export const validate_jira = async (ctx: ReporterContext): Promise<boolean> => {
  // if no credentials are provided
  if (!jira_username || !jira_password) {
    log_jira_error(ctx, 'Credentials were not provided')
    return false
  }

  // check to see if the url is valid
  try {
    const url = new URL(jira_server)
  } catch {
    log_jira_error(ctx, `Invalid URL format (from JIRA_URL): "${jira_server}"`)
    return false
  }

  // make the request
  const response = await jira_fetch('rest/api/2/myself')

  // handle 401
  if (response.status === 401) {
    log_jira_error(ctx, 'Invalid user credentials provided')
    return false
  }

  // handle other than 200
  if (response.status !== 200) {
    log_jira_error(ctx, 'Unable to connect to Jira')
    return false
  }

  // parse out the user, valid if so
  const user = await response.json()
  log_jira(
    ctx,
    `\nAuthenticated with the user:\n  ${ctx.chalk.cyan.bold(
      user.displayName
    )} (${ctx.chalk.cyan.bold(user.name)})`
  )
  return true
}

export const report_jira_results = async (
  ctx: ReporterContext,
  start_time: Date,
  end_time: Date,
  test_results: TestResult[]
) => {
  // * collect all jira test results
  // * separate them by test plan

  let test_plans = new Map<string | undefined, TestResult[]>()
  let used_jira_keys = new Set()
  for (const result of test_results) {
    const { meta, info } = result

    // skip tests with invalid meta
    if (!is_valid_jira_meta(meta)) continue

    // pull out key
    const test_key = meta.jiraTestKey

    // error if the key has been visited already
    if (used_jira_keys.has(test_key)) {
      log_jira_error(ctx, `Two tests have the same Test Issue key, ${test_key}`)
      return false
    }
    used_jira_keys.add(test_key)

    // skip skipped tests
    if (info.skipped) continue

    // pull out test plan key if exists
    let test_plan_key: any = meta.jiraTestPlanKey as string
    if (!is_valid_jira_key(test_plan_key as string)) test_plan_key = undefined

    // add the result to the plan
    if (!test_plans.has(test_plan_key)) test_plans.set(test_plan_key, [])
    test_plans.get(test_plan_key)?.push(result)
  }

  // * iterate over each test plan and make the execution for it

  for (const [test_plan_key, test_results] of test_plans) {
    await report_jira_execution(
      ctx,
      start_time,
      end_time,
      test_plan_key,
      test_results
    )
  }
}

export const report_jira_execution = async (
  ctx: ReporterContext,
  start_time: Date,
  end_time: Date,
  test_plan_key: string | undefined,
  test_results: TestResult[]
) => {
  // https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST#ImportExecutionResultsREST-XrayJSONresults

  const request_subject = test_plan_key
    ? `test plan ${test_plan_key}`
    : 'all unassociated tests'

  const iso_start_time = formatISO(start_time)
  const iso_end_time = formatISO(end_time)

  const body = {
    info: {
      // project: 'SPDRTEST',
      summary: `Execution of ${request_subject}`,
      description: 'This test execution was automatically generated.',
      //
      startDate: iso_start_time,
      finishDate: iso_end_time,
      testPlanKey: test_plan_key,
      //
      // version: 'v1.3',
      // user: 'admin',
      // revision: '1.0.42134',
      // testEnvironments: ['iOS', 'Android'],
    },
    tests: test_results.map(({ meta, info }) => ({
      start: iso_start_time,
      finish: iso_end_time,

      testKey: meta.jiraTestKey,
      status: status_from_info(info),
    })),
  }

  const response = await jira_fetch('rest/raven/1.0/import/execution', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  const response_text: string = await response.text()
  const response_json: any = JSON.parse(response_text)

  ctx.newline()

  // handle 400
  if (response.status === 400) {
    const { error } = response_json
    log_jira_error(
      ctx,
      `Unable to import execution results for ${request_subject}. ${error}`
    )
    return false
  }

  // handle non 200
  if (response.status !== 200) {
    log_jira_error(
      ctx,
      `Unable to import execution results for ${request_subject}, request returned with status ${response.status}`
    )
    log_jira(ctx, `${ctx.chalk.bold('Request response:')} ${response_text}`)
    return false
  }

  // log jira tickets associated with the new execution
  log_jira(
    ctx,
    `Successfully created execution ${ctx.chalk.bold(
      response_json.testExecIssue.key
    )}\nto contain all tests for ${request_subject}`
  )
  log_jira(
    ctx,
    test_results
      .map(({ meta }) => ' - ' + ctx.chalk.blue(`[${meta.jiraTestKey}]`))
      .join('\n')
  )

  // log errors from the request if any
  if (response_json?.infoMessages?.length > 0) {
    log_jira_error(ctx, `Errors from creating execution ticket:`)
    for (const message of response_json?.infoMessages) {
      log_jira_error(ctx, ` - ${message}`)
    }
  }
}
