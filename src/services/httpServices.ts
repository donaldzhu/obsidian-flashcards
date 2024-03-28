import axios from 'axios'

export const JOTOBA_URL = 'https://jotoba.de'
axios.defaults.baseURL = `${JOTOBA_URL}/api/search`

axios.interceptors.response.use(null, error => {
  const expectedError =
    error.response &&
    error.response.stauts >= 400 &&
    error.response.status <= 500
  if (!expectedError) console.log('An unexpected error occurred.')

  return Promise.reject(error)
})


export default {
  get: axios.get,
  post: axios.post,
  put: axios.put,
  delete: axios.delete,
}