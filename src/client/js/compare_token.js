function compare_token() {
  const token = JSON.parse(localStorage.getItem('token'))

  function date_diff_in_days(date) {
    const utc = (d) => {
      d = new Date(d)
      return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
    }
    return Math.floor((utc(new Date().getTime()) - utc(date)) / (1000 * 60 * 60 * 24))
  }
  
  if (!localStorage.getItem('token') || date_diff_in_days(token.date) > 4) {
    alert('You need login.')
    window.location.replace('/users/auth')
  }
}