# Endless Runner Game - Lightweight Backend

This is a simple, lightweight REST API backend for the React.js endless runner game. It uses Node.js, Express.js, and MongoDB.

## Features
- **No authentication required**: Distinguishes players purely through frontend-generated `guestId`s.
- **Performance-focused**: Built-in indexes for leaderboard queries (`score` -1) and user queries (`guestId` 1).
- **Auto-Cleanup**: Automatically cleans up a user's old scores, keeping only their 10 most recent runs per the requirement.

## API Endpoints

### 1. Save Score
- **URL**: `/api/save-score`
- **Method**: `POST`
- **Body**: 
  ```json
  {
    "guestId": "string-uuid",
    "score": 1500,
    "coins": 25,
    "distance": 320
  }
  ```
- **Description**: Stores the run data. It rejects scores > 100,000 to prevent basic cheating. Maintains only the 10 most recent scores per user.

### 2. Leaderboard
- **URL**: `/api/leaderboard`
- **Method**: `GET`
- **Description**: Returns the global top 10 highest scores with `score, coins, distance` (and `guestId` to identify them on the scoreboard).

### 3. Total Players
- **URL**: `/api/total-players`
- **Method**: `GET`
- **Description**: Returns the total number of unique players registered globally.

### 4. Player History
- **URL**: `/api/player-history/:guestId`
- **Method**: `GET`
- **Description**: Returns the 10 most recent scores for a specific player by `guestId`.

## How to Run Locally

1. **Install Dependencies**
   Navigate to the `backend` folder and install NPM packages (already partially installed):
   ```bash
   cd backend
   npm install
   ```

2. **MongoDB**
   Ensure you have a MongoDB instance running locally on `mongodb://127.0.0.1:27017` or change the `MONGODB_URI` environment variable inside `backend/.env` to point to your MongoDB Atlas cluster.

3. **Start the Server**
   ```bash
   npm start
   ```
   *The server will run on http://localhost:5000 and connect to the local MongoDB database if available.*
