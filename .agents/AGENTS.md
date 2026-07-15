# Project Rules & Customizations

## Deployment Pipeline
Whenever the user asks to upload, deploy, or update the changes on the server, execute this sequence:

1. Run `tsc` compiler to verify there are no compilation errors:
   `powershell -ExecutionPolicy Bypass -Command "npx tsc"`

2. Package the built `dist` and public `public` directories into a zip file named `crm_update.zip` (force overwrite):
   `powershell -ExecutionPolicy Bypass -Command "Compress-Archive -Path dist, public -DestinationPath crm_update.zip -Force"`

3. Upload the zip package to the remote server using the pre-configured SSH host alias `bsa-crm`:
   `scp "D:\CRM V0\crm_update.zip" bsa-crm:/home/bsa/crm/crm_update.zip`

4. Unzip the package on the remote server, remove the zip, and restart the Phusion Passenger application to apply the changes:
   `ssh bsa-crm "cd /home/bsa/crm && unzip -o crm_update.zip && rm crm_update.zip && touch tmp/restart.txt"`
