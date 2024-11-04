import os
import subprocess

def push_to_github():
    try:
        token = os.environ.get('GITHUB_TOKEN')
        if not token:
            raise ValueError("GitHub token not found in environment variables")
            
        # Configure git
        subprocess.run(['git', 'config', '--global', 'user.name', 'Replit User'], check=True)
        subprocess.run(['git', 'config', '--global', 'user.email', 'replit@example.com'], check=True)
        
        # Remove existing remote if it exists
        subprocess.run(['git', 'remote', 'remove', 'origin'], check=False)
        
        # Add new remote with token authentication
        repo_url = f'https://{token}@github.com/xYUNUSx2727/pallet-management-system.git'
        subprocess.run(['git', 'remote', 'add', 'origin', repo_url], check=True)
        
        # Push to GitHub
        subprocess.run(['git', 'branch', '-M', 'main'], check=True)
        subprocess.run(['git', 'push', '-u', 'origin', 'main'], check=True)
        print("Successfully pushed to GitHub!")
        
    except Exception as e:
        print(f"Error pushing to GitHub: {str(e)}")
        raise

if __name__ == "__main__":
    push_to_github()
