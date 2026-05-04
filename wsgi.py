import sys
import os

project_home = '/home/goheat207/backtest_project'

if project_home not in sys.path:
    sys.path.insert(0, project_home)

os.environ['FLASK_ENV'] = 'production'

from server import app as application
