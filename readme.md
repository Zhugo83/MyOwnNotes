## Readme for MyOwnNotes

This is a simple note-taking app that uses WebSockets to synchronize changes between clients. It's designed to be used with a server-side script that handles the synchronization and authentication.

## How to use

1. Create a Channel by clicking the "Create Channel" button. with the time you want it to be self-destructed.
2. Start typing in the text area.
3. You can set up a Modification password and a Visibility password.
- Modification password: This password is required to make changes to the text area. It is not required to view the text.
- Visibility password: This password is required to view the text.
4. Share the Channel URL with your friends.

# Feature

Synchronization: The app uses WebSockets to synchronize changes between clients. It is designed to be used with a server-side script that handles the synchronization and authentication.

Making editing text with multiple users possible: The app allows multiple users to edit the text area simultaneously.

## Security

This note-taking app is designed to be used with a server-side script that handles the synchronization and authentication. It is not intended to be used as a standalone application.