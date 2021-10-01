import { ReporterContext, TaskResult, TestRunInfo } from './interfaces/reporter'
import { format, formatDistanceStrict } from 'date-fns'

export const log_test_run_old = (
  ctx: ReporterContext,
  name: string,
  info: TestRunInfo,
  meta: any
) => {
  var has_error = !!info.errs.length

  let line = []

  let full_name = name
  if (meta.jiraTestKey) {
    full_name = `[${meta.jiraTestKey}] ${full_name}`
  }

  if (info.skipped) {
    line.push(ctx.chalk.cyan(`~ ${full_name}`))
  } else if (has_error) {
    line.push(ctx.chalk.red.bold(`✖ ${full_name}`))
  } else {
    line.push(ctx.chalk.green(`✓ ${full_name}`))
  }

  ctx //
    .setIndent(2)
    .write(line.join(' '))
    .newline()

  // ctx.setIndent(1).useWordWrap(true)

  // if (info.screenshotPath)
  //   title += ` (screenshots: ${ctx.chalk.underline.grey(
  //     info.screenshotPath
  //   )})`

  // ctx.write(title)

  // if (has_error) ctx._renderErrors(test_run_info.errs)/

  // ctx.afterErrorList = has_error
}

export const log_test_run = (
  ctx: ReporterContext,
  index: number,
  name: string,
  info: TestRunInfo,
  meta: any
) => {
  const has_error = !!info.errs.length

  let parts = []

  // test count
  parts.push(ctx.chalk.grey(`(${index})`.padEnd(5)))
  parts.push(' ')

  // test status
  let status
  if (info.skipped) {
    status = ctx.chalk.cyan('SKIPPED')
  } else if (has_error) {
    status = ctx.chalk.red.bold('FAILED ')
  } else {
    status = ctx.chalk.green('PASSED ')
  }
  parts.push(status)
  parts.push(' ')

  // jira key
  if (meta.jiraTestKey) {
    parts.push(ctx.chalk.blue(`[${meta.jiraTestKey}] `))
  }

  // test title
  parts.push(name)

  // if unstable
  if (info.unstable) {
    parts.push('\n')
    parts.push(' '.repeat(5 + 1 + 7 + 1))

    let q_summary = []
    let total = 0
    let pass_count = 0
    for (const index in info.quarantine) {
      const { passed } = info.quarantine[index]
      if (passed) {
        q_summary.push(ctx.chalk.green(`✓`))
        pass_count += 1
      } else q_summary.push(ctx.chalk.red(`✖`))
      total += 1
    }

    parts.push(
      ctx.chalk.yellow('(UNSTABLE: ') +
        q_summary.join('') +
        ctx.chalk.yellow(')')
    )
  }

  ctx //
    .setIndent(1)
    .useWordWrap(false)
    .write(parts.join(''))
    .newline()
}

export const log_header = (ctx: ReporterContext, title: string) => {
  const width = 50

  let parts = []
  parts.push('\n┌')
  parts.push('─'.repeat(width - 2))
  parts.push('┐\n')
  parts.push('│ ')
  parts.push(title.padEnd(width - 3))
  parts.push('│\n')
  parts.push('└')
  parts.push('─'.repeat(width - 2))
  parts.push('┘')

  ctx //
    .setIndent(0)
    .write(ctx.chalk.white.bold(parts.join('')))
    .newline()
}

export const log_subheader = (ctx: ReporterContext, text: string) => {
  ctx //
    .setIndent(1)
    .write(ctx.chalk.white.bold(text))
    .newline()
    .newline()
}

export const log_fixture = (ctx: ReporterContext, name: string) =>
  log_subheader(ctx, `\nFIXTURE: ${ctx.chalk.reset(name)}`)

export const log_user_agents = (
  ctx: ReporterContext,
  user_agents: string[]
) => {
  ctx
    .setIndent(1)
    .newline()
    .useWordWrap(true)
    .write(ctx.chalk.bold('Browsers'))
    .newline()

  user_agents.forEach((agent) => {
    ctx //
      .write(`- ${ctx.chalk.blue(agent)}`)
      .newline()
  })
}

export const log_jira_error = (ctx: ReporterContext, message: string) => {
  ctx //
    .setIndent(1)
    .write(ctx.chalk.red(message))
    .newline()
}

export const log_jira = (ctx: ReporterContext, message: string) => {
  ctx //
    .setIndent(1)
    .write(ctx.chalk.white(message))
    .newline()
}

export const log_results = (
  ctx: ReporterContext,
  start_time: Date,
  end_time: Date,
  { passedCount, failedCount, skippedCount }: TaskResult
) => {
  const parts = []

  const total = passedCount + failedCount
  const percent = (passedCount / total) * 100

  parts.push(ctx.chalk.bold(`${passedCount} / ${total}`))
  parts.push(ctx.chalk.bold(` (${percent.toFixed(0)}%)`))
  parts.push('\n')

  const duration_string = formatDistanceStrict(start_time, end_time)
  parts.push(ctx.chalk.gray(`took ${duration_string}`))
  parts.push('\n\n')

  parts.push(passedCount.toString().padEnd(3))
  parts.push(ctx.chalk.bold.green(' PASSED'))
  parts.push('\n')

  parts.push(failedCount.toString().padEnd(3))
  parts.push(ctx.chalk.bold.red(' FAILED'))
  parts.push('\n')

  parts.push(skippedCount.toString().padEnd(3))
  parts.push(ctx.chalk.bold.cyan(' SKIPPED'))

  ctx //
    .setIndent(1)
    .newline()
    .write(parts.join(''))
    .newline()
}

export const log_current_time = (ctx: ReporterContext) => {
  const now = new Date()
  ctx
    .setIndent(1)
    .newline()
    .useWordWrap(true)
    .write(ctx.chalk.bold(format(now, 'PPPppp')))
    .newline()
}

export const log_error = (ctx: ReporterContext, errs: any[]) => {
  ctx.setIndent(3)

  errs.forEach((err: any, idx: number) => {
    var prefix = ctx.chalk.red(`${idx + 1}) `)

    ctx.newline().write(ctx.formatError(err, prefix)).newline().newline()
  })
}
