npm run -s $1
npm run -s $2

if [[ $? -eq 130 ]]
then
  exit 0
else
  exit $?
fi
