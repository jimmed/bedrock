# Bedrock

*A tool for spinning up and managing modded Minecraft servers*

## Eventual Goal

 - A web interface where you can manage and upgrade your modded Minecraft servers.
 - Tight integration with CurseForge, and later any other modpack platforms.
 - Search for the modpack you want to install, select version, click GO!
   Everything (Minecraft, mods, Forge) will be installed automatically
 - Proper integrity checking on every file downloaded, caching for speed
 - One-click updates

## Roadmap
 - [x] Config management
 - [ ] Internal API
   - [ ] Vanilla Minecraft server
     - [ ] Version lookup
     - [x] Server download
       - [ ] Integrity check
     - [x] Server installation
     - [ ] First-time startup check
     - [ ] Server update
   - [ ] CurseForge integration
     - [x] Project search
     - [x] Project version listing
     - [x] Project manifests
     - [x] Modpack download
       - [ ] With server pack
         - [ ] Integrity check
       - [x] Without server pack
         - [ ] Integrity check
     - [x] Modpack dependency installation
     - [x] Forge installation
       - [ ] Integrity check
     - [ ] Modpack update
   - [ ] Server instance management
     - [ ] PM2 integration
       - [ ] Install startup scripts
       - [ ] Launch/shutdown/list processes
     - [ ] Manage server config
      - [ ] Vanilla server.properties
      - [ ] Ops/whitelist/ban management
      - [ ] FTB utilities
     - [ ] Launch server
     - [ ] Stop server gracefully
     - [ ] RCON support
     - [ ] Server ping support
     - [ ] Gamedata/Player data
       - [ ] Achievements
       - [ ] In-memory cache + file-watcher
       - [ ] Vanilla world-save support
       - [ ] FTB utilities stats support
       - [ ] Dynmap plugin
       - [ ] Custom achievements plugin
   - [ ] Options sets
     - [ ] Management
     - [ ] Applying to servers
   - [ ] Backup management
     - [ ] Copy backup to remote
     - [ ] FTB utilties support
     - [ ] AromaBackup support
   - [ ] Crontab management
    - [ ] Integrate with system cron (somehow?)
    - [ ] Global tasks
    - [ ] Per-server tasks
 - [ ] Data model/persistence
 - [ ] GraphQL API
 - [ ] Web interface
