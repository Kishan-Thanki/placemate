# Contributing to Placemate
Welcome to the Placemate project! We're excited to have you on board. This guide will help you get started with the project and understand our workflow, ensuring that your contributions are integrated smoothly.

🤝 **Our Code of Conduct**  
We are committed to creating a welcoming and inclusive environment. Please be respectful and professional in all of your interactions.

🚀 **Getting Started**  
To begin contributing, please follow this standard workflow. It helps us keep the project organized and ensures everyone's work is integrated smoothly.

### Step 1: Clone the Repository
Start by cloning the project to your local machine. If this is your first time, you can do this from the terminal.

```bash
git clone https://github.com/Kishan-Thanki/placemate.git
```

### Step 2: Navigate to the Project Directory
Move into the newly cloned project directory.

```bash
cd placemate
```

### Step 3: Check Out the dev Branch
All new work should be based on the latest version of the `dev` branch. The `dev` branch is where all feature development happens.

```bash
# First, make sure you are on the dev branch
git checkout dev

# Then, pull the latest changes to ensure your branch is up to date
git pull origin dev
```

**Why this is important:** Pulling the latest changes prevents merge conflicts and ensures you're working with the most recent version of the codebase.

### Step 4: Create a New Feature Branch
Create a new branch for your specific task or feature. This isolates your changes and keeps the main `dev` branch clean.  
Please use the following naming convention to keep things consistent:

```
your-username/feature-name
```

For example, if your username is `alice` and you are working on user authentication:

```bash
git checkout -b alice/user-authentication
```

This ensures we know who is working on what.

### Step 5: Make Your Changes and Commit
Write your code and make your commits with clear, descriptive messages.  
A good commit message should be in the imperative mood (e.g., "Add user authentication feature" instead of "Added user authentication feature").

```bash
# After making your changes, stage them
git add .

# Then, commit your changes with a descriptive message
git commit -m "feat: Add user registration and login functionality"
```

**Note:** We use a simple convention for commit messages to keep our commit history clean. Common prefixes include:

- `feat:` (for new features)
- `fix:` (for bug fixes)
- `docs:` (for documentation changes)
- `style:` (for code style changes)
- `refactor:` (for code refactoring without feature changes)

### Step 6: Push Your Branch
Push your new branch to the remote repository on GitHub.  
The `-u` flag sets the upstream branch, so you can just use `git push` from now on.

```bash
git push -u origin your-username/feature-name
```

---

## 📝 Pull Request (PR) Workflow
When you're ready to submit your changes, follow these steps to create a pull request on GitHub:

1. **Open a Pull Request:** On GitHub, you'll see a prompt to open a pull request from your feature branch to the `dev` branch.  
2. **Describe Your Changes:** In the PR description, clearly explain the purpose of your changes. Link to any relevant issues by typing `#` followed by the issue number (e.g., #123).  
3. **Request a Review:** Ask at least one other team member to review your pull request. They will check for bugs, code quality, and consistency.  
4. **Resolve Conflicts:** If there are any merge conflicts (due to someone else merging code while you were working), you must resolve them on your local machine and push the updated branch.  

Example of resolving conflicts:

```bash
# Go back to your dev branch
git checkout dev

# Pull the latest changes from dev
git pull origin dev

# Go back to your feature branch
git checkout your-username/feature-name

# Merge the updated dev branch into your feature branch
git merge dev
```

**Note:** `git merge dev` will show you any conflicts, which you'll need to manually resolve in your code editor.  
After resolving them, `git add .`, `git commit`, and `git push`.

5. **Merge:** Once your PR has been reviewed and approved, it can be merged into the `dev` branch.

⚠️ **Important:** No one should ever push directly to the `main` or `dev` branches. All changes must go through a pull request.

---

## 🐛 Issues and Task Tracking
We use GitHub's **Issues** to track bugs and tasks.

- **Reporting a Bug:** If you find a bug, please check the existing issues to see if it has already been reported. If not, open a new issue and provide a clear, detailed description of the problem, including steps to reproduce it.  
- **Requesting a Feature:** If you have an idea for a new feature, feel free to open an issue to discuss it.  
- **Claiming a Task:** If you want to work on a task, assign yourself to an open issue to let others know you are working on it.