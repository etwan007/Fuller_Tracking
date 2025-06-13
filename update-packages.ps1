# Update npm packages script
Set-Location "C:\Fuller_Tracking"

Write-Host "Updating packages to latest versions..."

# Install latest versions of dependencies
npm install @fullcalendar/daygrid@latest
npm install @fullcalendar/react@latest 
npm install cookie@latest
npm install date-fns@latest
npm install firebase@latest
npm install googleapis@latest
npm install node-fetch@latest
npm install prop-types@latest
npm install react@latest
npm install react-big-calendar@latest
npm install react-dom@latest
npm install vite@latest

# Install latest dev dependencies
npm install @vitejs/plugin-react@latest --save-dev

Write-Host "Package updates complete!"
