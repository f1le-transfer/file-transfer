function compare_token() {
  const token = JSON.parse(localStorage.getItem('token'))

  function date_diff_in_hours(date) {
    let diff =(new Date().getTime() - new Date(date).getTime()) / 1000
    diff /= (60 * 60)
    return Math.abs(Math.round(diff))
  }
  
  if (!localStorage.getItem('token') || date_diff_in_hours(token.date) > 4) {
    alert('You need login.')
    window.location.replace('/users/auth')
  }
}