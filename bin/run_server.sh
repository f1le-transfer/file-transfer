path=./src/server/index.js

if [[ $1 == 'dev' ]]
then
  echo '**Server is running in development mode**'
  echo
  nodemon $path
else
  echo '**Server is running in production mode**'
  echo
  node $path
fi

if [ $? -eq 130 ]; then 
  exit 0
else 
  exit $?
fi