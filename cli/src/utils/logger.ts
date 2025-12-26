import chalk from 'chalk';

class Logger {
  success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  error(message: string): void {
    console.log(chalk.red('✗'), message);
  }

  warning(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  log(message: string): void {
    console.log(message);
  }

  header(message: string): void {
    console.log('\n' + chalk.bold.cyan(message));
  }

  section(message: string): void {
    console.log('\n' + chalk.bold(message));
  }
}

export const logger = new Logger();
