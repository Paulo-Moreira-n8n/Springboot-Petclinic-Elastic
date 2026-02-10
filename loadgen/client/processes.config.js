module.exports = {
  apps: [
    {
      name: "chrome",
      script: "/usr/bin/google-chrome-stable",
      args: [
        "--remote-debugging-address=0.0.0.0",
        "--remote-debugging-port=9222",
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ].join(" "),
      exec_interpreter: "none",
      exec_mode: "fork",
      restart_delay: 2000
    },
    {
      name: "worker",
      script: "./tasks.js",
      instances: 1
    }
  ]
}
