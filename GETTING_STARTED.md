# Getting Started Guide - Step by Step

This guide will walk you through running the Identity Reconciliation Service from scratch.

## 📋 Prerequisites Check

Before starting, make sure you have these installed:

### 1. Check Node.js Installation

Open your terminal (PowerShell on Windows, Terminal on Mac/Linux) and run:

```bash
node --version
```

**Expected:** Should show `v18.0.0` or higher (e.g., `v18.17.0`)

**If not installed:**
- Download from: https://nodejs.org/
- Install the LTS (Long Term Support) version
- Restart your terminal after installation

### 2. Check npm Installation

```bash
npm --version
```

**Expected:** Should show `9.0.0` or higher (e.g., `9.8.1`)

npm comes with Node.js, so if Node.js is installed, npm should be too.

### 3. Check PostgreSQL (Docker)

Since you're using Docker PostgreSQL, check if Docker is running:

```bash
docker ps
```

**Expected:** Should show running containers (including your PostgreSQL container)

**If Docker is not running:**
- Start Docker Desktop
- Wait for it to fully start

---

## 🚀 Step-by-Step Setup

### Step 1: Navigate to Project Directory

Open your terminal and navigate to the project folder:

```bash
cd /mnt/c/Users/Saurabh/Desktop/Work/project1
```

Or if you're in Windows PowerShell:
```powershell
cd C:\Users\Saurabh\Desktop\Work\project1
```

### Step 2: Install Dependencies

Install all required packages:

```bash
npm install
```

**What this does:**
- Reads `package.json`
- Downloads all dependencies (express, prisma, typescript, etc.)
- Creates `node_modules/` folder
- Takes 1-2 minutes

**Expected output:**
```
added 234 packages, and audited 235 packages in 45s
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the project root:

**Option A: Using Terminal (WSL/Linux/Mac)**
```bash
cat > .env << EOF
DATABASE_URL="postgresql://bitespeed_user:securepassword@localhost:5434/bitespeed"
PORT=3000
NODE_ENV=development
EOF
```

**Option B: Using Windows PowerShell**
```powershell
@"
DATABASE_URL=postgresql://bitespeed_user:securepassword@localhost:5434/bitespeed
PORT=3000
NODE_ENV=development
"@ | Out-File -FilePath .env -Encoding utf8
```

**Option C: Manual Creation**
1. Create a new file named `.env` in the project root
2. Copy and paste this content:
```
DATABASE_URL="postgresql://bitespeed_user:securepassword@localhost:5434/bitespeed"
PORT=3000
NODE_ENV=development
```

**Important:** 
- Replace the DATABASE_URL with your actual database credentials if different
- Make sure there are no spaces around the `=` sign
- Keep the quotes around the DATABASE_URL

### Step 4: Generate Prisma Client

Generate the Prisma Client (database access layer):

```bash
npm run prisma:generate
```

**What this does:**
- Reads `prisma/schema.prisma`
- Generates TypeScript types for your database
- Creates database access code

**Expected output:**
```
✔ Generated Prisma Client (v6.19.0) to ./node_modules/@prisma/client
```

### Step 5: Set Up Database Schema

Sync your database schema with Prisma:

```bash
npx prisma db push
```

**What this does:**
- Connects to your PostgreSQL database
- Creates the `Contact` table if it doesn't exist
- Updates the schema if it changed

**Expected output:**
```
✔ Your database is now in sync with your Prisma schema.
```

**If you get an error:**
- Check that your PostgreSQL container is running: `docker ps`
- Verify DATABASE_URL in `.env` is correct
- Make sure the database exists

### Step 6: Verify Database Connection (Optional)

You can verify the database connection using Prisma Studio:

```bash
npm run prisma:studio
```

**What this does:**
- Opens a web interface at `http://localhost:5555`
- Shows your database tables and data
- Useful for viewing/managing data

**To exit:** Press `Ctrl+C` in the terminal

---

## ▶️ Running the Application

### Development Mode (Recommended)

Start the development server with hot reload:

```bash
npm run dev
```

**What this does:**
- Compiles TypeScript to JavaScript
- Starts the Express server
- Watches for file changes and auto-restarts
- Shows logs in the terminal

**Expected output:**
```
[INFO] ts-node-dev ver. 2.0.0
[INFO] Server started successfully
Server is running on port 3000
```

**You should see:**
- Server running message
- Port number (3000)
- Any request logs when you make API calls

**To stop the server:** Press `Ctrl+C`

### Production Mode

If you want to run in production mode:

```bash
# First, build the project
npm run build

# Then start the server
npm start
```

**What this does:**
- Compiles all TypeScript to JavaScript in `dist/` folder
- Runs the compiled JavaScript
- No hot reload (restart manually after changes)

---

## 🧪 Testing the Application

### Test 1: Health Check

Open a new terminal window (keep the server running) and test the health endpoint:

**Using curl (WSL/Linux/Mac):**
```bash
curl http://localhost:3000/health
```

**Using PowerShell (Windows):**
```powershell
Invoke-RestMethod -Uri http://localhost:3000/health
```

**Using Browser:**
Open: `http://localhost:3000/health`

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-18T...",
  "service": "bitespeed-identity-reconciliation"
}
```

### Test 2: Create a Contact

**Using curl (WSL/Linux/Mac):**
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "1234567890"}'
```

**Using PowerShell (Windows):**
```powershell
$body = @{
    email = "test@example.com"
    phoneNumber = "1234567890"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/identify -Method POST -ContentType "application/json" -Body $body
```

**Expected Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["test@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": []
  }
}
```

### Test 3: Using Postman

1. **Open Postman**
2. **Create a new request:**
   - Method: `POST`
   - URL: `http://localhost:3000/identify`
3. **Set Headers:**
   - Key: `Content-Type`
   - Value: `application/json`
4. **Set Body:**
   - Select "raw"
   - Select "JSON" from dropdown
   - Paste:
     ```json
     {
       "email": "test@example.com",
       "phoneNumber": "1234567890"
     }
     ```
5. **Click "Send"**

---

## 🔍 Verifying Everything Works

### Check Server Logs

In the terminal where `npm run dev` is running, you should see:

```
[INFO] Incoming request
[INFO] Request completed
```

### Check Database

Run Prisma Studio to see the data:

```bash
npm run prisma:studio
```

Then open `http://localhost:5555` in your browser. You should see:
- A `Contact` table
- Your test contact data

### Check Response Format

Verify the response has:
- ✅ `contact.primaryContatctId` (number)
- ✅ `contact.emails` (array)
- ✅ `contact.phoneNumbers` (array)
- ✅ `contact.secondaryContactIds` (array)

---

## 🐛 Troubleshooting

### Problem: "DATABASE_URL environment variable is required"

**Solution:**
1. Check that `.env` file exists in project root
2. Verify `.env` file has `DATABASE_URL=...`
3. Make sure no spaces around `=`
4. Restart the server after creating `.env`

### Problem: "Cannot connect to database"

**Solution:**
1. Check PostgreSQL container is running:
   ```bash
   docker ps
   ```
2. Verify DATABASE_URL matches your container:
   - Username: `bitespeed_user`
   - Password: `securepassword`
   - Host: `localhost`
   - Port: `5434`
   - Database: `bitespeed`
3. Test connection:
   ```bash
   docker exec bitespeed-identity-postgres-1 psql -U bitespeed_user -d bitespeed -c "SELECT 1;"
   ```

### Problem: "Port 3000 already in use"

**Solution:**
1. Find what's using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/Mac
   lsof -i :3000
   ```
2. Kill the process or change PORT in `.env`:
   ```
   PORT=3001
   ```

### Problem: "Module not found" errors

**Solution:**
1. Delete `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install` again

### Problem: Prisma errors

**Solution:**
1. Regenerate Prisma Client:
   ```bash
   npm run prisma:generate
   ```
2. Reset database (WARNING: deletes all data):
   ```bash
   npx prisma migrate reset
   ```
3. Or push schema again:
   ```bash
   npx prisma db push
   ```

---

## 📝 Quick Reference Commands

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Sync database schema
npx prisma db push

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Open database GUI
npm run prisma:studio

# Check for errors
npm run lint
npm run type-check
```

---

## 🎯 Complete Setup Checklist

- [ ] Node.js v18+ installed
- [ ] npm installed
- [ ] Docker PostgreSQL running
- [ ] Project folder navigated to
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with DATABASE_URL
- [ ] Prisma Client generated (`npm run prisma:generate`)
- [ ] Database schema synced (`npx prisma db push`)
- [ ] Server started (`npm run dev`)
- [ ] Health check works (`GET /health`)
- [ ] Can create contact (`POST /identify`)

---

## 🚀 Next Steps

Once everything is running:

1. **Test the API** using the test cases in `xyz.md`
2. **Use Postman** for easier testing (see `POSTMAN_TESTING_GUIDE.md`)
3. **Check the database** using Prisma Studio
4. **Read the code** to understand how it works
5. **Experiment** with different requests

---

## 💡 Tips

1. **Keep server running:** Don't close the terminal where `npm run dev` is running
2. **Use separate terminal:** Open a new terminal for running commands while server runs
3. **Check logs:** Server logs show all requests and errors
4. **Database GUI:** Prisma Studio is great for viewing data
5. **Hot reload:** Changes to code auto-restart the server in dev mode

---

**You're all set! 🎉**

If you encounter any issues, check the Troubleshooting section above or review the error messages in the terminal.

