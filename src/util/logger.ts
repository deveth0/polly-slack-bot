class Logger {
  log(obj: unknown) {
    console.error(`-------\n${JSON.stringify(obj)}\n----------`);
  }
}

export default new Logger();
