import subprocess
import os

cmd = F"python3 {os.getcwd()}/test.py"
print(cmd)

process = subprocess.Popen(cmd.split(), close_fds=True)