import os
import subprocess
import sys

def get_author_name_github():
    try:
        if "CI" in os.environ:
            author_name = os.environ.get("GIT_AUTHOR_NAME", "CI User")
            github_user = os.environ.get("GITHUB_ACTOR", "ci-bot")
        else:
            author_name = subprocess.check_output(["git", "config", "user.username"]).strip().decode("utf-8")
            github_user = os.environ.get("GITHUB_USER", os.getlogin())

        return author_name, github_user
    except subprocess.CalledProcessError as e:
        print(f"Error getting author details: {e}")
        sys.exit(1)

def update_authors_file(author_name, github_user):
    authors_file = "AUTHORS.md"
    new_entry = f"| {author_name} | {github_user} |"
    if os.path.exists(authors_file):
        with open(authors_file, "r") as f:
            authors = f.read()
    else:
        authors = "| Name | Github user |\n|--|-------------|\n"
    if new_entry not in authors:
        with open(authors_file, "a") as f:
            f.write(f"{new_entry}\n")
        print(f"Added {new_entry} to {authors_file}")
    else:
        print(f"{new_entry} already exists in {authors_file}")

if __name__ == "__main__":
    author_name, github_user = get_author_name_github()
    update_authors_file(author_name, github_user)
