class Logger {
  log(obj: unknown) {
    console.log(`-------\n${JSON.stringify(obj)}\n----------`);
  }
}

export default new Logger();
