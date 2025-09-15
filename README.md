# Collaborative Whiteboard

A real-time collaborative whiteboard application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) and Socket.io for live collaboration.

## Features

- **Real-time Collaboration**: Multiple users can draw simultaneously with live synchronization
- **Room Management**: Join existing rooms or create new ones with simple 6-8 character codes
- **Drawing Tools**: 
  - Pencil/pen tool with smooth drawing
  - Adjustable stroke width (1-20px)
  - Color selection (Black, Red, Blue, Green)
  - Clear canvas functionality
- **Live Cursor Tracking**: See other users' cursor positions in real-time
- **User Presence**: Display active user count
- **Persistent Drawing**: Drawings are saved and restored when joining a room

## Technology Stack

- **Frontend**: React.js with HTML5 Canvas
- **Backend**: Node.js with Express.js
- **Database**: MongoDB Atlas
- **Real-time Communication**: Socket.io
- **Styling**: CSS

## Setup Instructions

1. **Clone the repository**
```bash
   git clone <your-repo-url>
   cd collaborative-whiteboard

Install dependencies

bash   npm run install-all

Setup MongoDB Atlas

Create a MongoDB Atlas account
Create a cluster and database user
Get your connection string


Configure environment variables
Create a .env file in the server directory:

   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/whiteboard?retryWrites=true&w=majority
   NODE_ENV=development

Run the application

bash   npm run dev

Access the application
Open your browser and go to http://localhost:3000

Usage

Joining a Room

Enter an existing room code or click "Create New Room"
Share your room code with others


Drawing

Use the pencil tool to draw on the canvas
Adjust stroke width and change colors
Clear the canvas when needed


Collaboration

See other users' cursors in real-time
All drawing actions are synchronized instantly
