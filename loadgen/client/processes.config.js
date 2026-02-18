// processes.config.js

module.exports = {
  apps: [
    {
      name: 'base_worker',
      script: './tasks.js',
      args: ["users.csv", "20000:10000", "1000:1000"],
      instances: 1,
      env: {
        PETCLINIC_BASE_URL: process.env.PETCLINIC_BASE_URL || 'http://spring-petclinic-client:3000'
      }
    },
    {
      name: 'edit_owner_worker',
      script: './edit_owner.js',
      instances: 1,
      env: {
        PETCLINIC_BASE_URL: process.env.PETCLINIC_BASE_URL || 'http://spring-petclinic-client:3000'
      }
    },
    {
      name: 'windows_worker',
      script: './tasks.js',
      args: ["windows_users.csv", "120000:20000", "10000:10000"],
      instances: 1,
      env: {
        PETCLINIC_BASE_URL: process.env.PETCLINIC_BASE_URL || 'http://spring-petclinic-client:3000'
      }
    }
    // ⚠️ REMOVA o app "chrome" — ele é desnecessário!
  ]
};