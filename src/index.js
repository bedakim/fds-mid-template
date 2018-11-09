import '@babel/polyfill' // 이 라인을 지우지 말아주세요!

import axios from 'axios'
import { listenerCount } from 'cluster';

const api = axios.create({
  baseURL: process.env.API_URL
})

api.interceptors.request.use(function (config) {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = 'Bearer ' + token
  }
  return config
});

const templates = {
  mainImg: document.querySelector('#main-img').content,
  category: document.querySelector('#category').content,
  loginForm: document.querySelector('#login-form').content,
  signupForm: document.querySelector('#signup-form').content,
  itemList: document.querySelector('#item-list').content,
  itemItem: document.querySelector('#item-item').content,
  itemDetail: document.querySelector('#item-detail-from').content,
  itemDetailImg: document.querySelector('#item-detail-img').content,

}

const rootEl = document.querySelector('.root')
// 페이지 그리는 함수 작성 순서
// 1. 템플릿 복사
// 2. 요소 선택
// 3. 필요한 데이터 불러오기
// 4. 내용 채우기
// 5. 이벤트 리스너 등록하기
// 6. 템플릿을 문서에 삽입

const loginEl = document.querySelector('.login')
const signupEl = document.querySelector('.signup')
const logoEl = document.querySelector('.logo')
logoEl.addEventListener('click',  e => {
  e.preventDefault()
  drawMain()
})


//메인화면
async function drawMain() {
  // 1. 템플릿 복사
  const img = document.importNode(templates.mainImg, true)
  const category = document.importNode(templates.category, true)
  const frag = document.importNode(templates.itemList, true)
  // 2. 요소 선택
  const listEl = frag.querySelector('.item-list')
  // 3. 필요한 데이터 불러오기
  const {data: itemList} = await api.get('/products/')
  // 4. 내용 채우기
  for (const itemItem of itemList){
    const frag = document.importNode(templates.itemItem, true)

    const imgEl = frag.querySelector('.item-item-img')
    const titleEl = frag.querySelector('.title')
    const priceEl = frag.querySelector('.price')

    imgEl.setAttribute('src', itemItem.mainImgUrl)
    titleEl.textContent = itemItem.title
    priceEl.textContent = itemItem.price

    imgEl.addEventListener('click',async e=>{
      e.preventDefault()
      itemDetail(itemItem.id)
    })

    listEl.appendChild(frag)
  }

  // 5. 이벤트 리스너 등록하기
loginEl.addEventListener('click', async e => {
  e.preventDefault()
  drawLogin()
})

signupEl.addEventListener('click', async e => {
  e.preventDefault()
  drawSignUp()
})
  // 6. 템플릿을 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(img)
  rootEl.appendChild(category)
  rootEl.appendChild(frag)
}
drawMain()


//로그인 화면
async function drawLogin() {
// 1. 템플릿 복사
  const frag = document.importNode(templates.loginForm, true)
  // 2. 요소 선택
  const formEl = frag.querySelector('.login-form')
  // 3. 필요한 데이터 불러오기
  // 4. 내용 채우기
  // 5. 이벤트 리스너 등록하기
  formEl.addEventListener('submit', async e => {
    e.preventDefault()
    const username = e.target.elements.username.value
    const password = e.target.elements.password.value

    const res = await api.post('/users/login', {
      username,
      password
    })

    localStorage.setItem('token', res.data.token)
    drawMain()
  })
  // 6. 템플릿을 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(frag)
}




//회원가입 화면
async function drawSignUp() {
// 1. 템플릿 복사
const frag = document.importNode(templates.signupForm, true)
// 2. 요소 선택
// 3. 필요한 데이터 불러오기
// 4. 내용 채우기
// 5. 이벤트 리스너 등록하기
// 6. 템플릿을 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(frag)

}
//상세 페이지
async function itemDetail(productId) {
// 1. 템플릿 복사
const frag = document.importNode(templates.itemDetail, true)
// 2. 요소 선택
const mainImgEl = frag.querySelector('.item-img')
const itemDetailEl = frag.querySelector('.item-detail-img')
const titleEl = frag.querySelector('.dt-title')
const priceEl = frag.querySelector('.dt-price')
const descriptionEl = frag.querySelector('.dt-description')

// 3. 필요한 데이터 불러오기
const {data: itemData} = await api.get('/products/' + productId,{
  params: {
    _expand: 'id'
  }
})
// 4. 내용 채우기

titleEl.textContent = itemData.title
priceEl.textContent = itemData.price
descriptionEl.textContent = itemData.description
mainImgEl.setAttribute('src',itemData.mainImgUrl)

for ( const imgUrl of itemData.detailImgUrls){
  // 1. 템플릿 복사
  const frag = document.importNode(templates.itemDetailImg, true);
  // 2. 요소 선택
  const dtImg = frag.querySelector('.dt-img')
  // 3. 필요한 데이터 불러오기
  // 4. 내용 채우기
  dtImg.setAttribute('src', imgUrl)
  // 5. 이벤트 리스너 등록하기
  // 6. 템플릿을 문서에 삽입
  itemDetailEl.appendChild(frag)
}


// 5. 이벤트 리스너 등록하기


// 6. 템플릿을 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(frag)
}


//장바구니
async function drawCart() {
// 1. 템플릿 복사
// 2. 요소 선택
// 3. 필요한 데이터 불러오기
// 4. 내용 채우기
// 5. 이벤트 리스너 등록하기
// 6. 템플릿을 문서에 삽입

}

// 로그인시 그릴 화면
if (localStorage.getItem('token')){
  drawMain()
  updateLoginButton()
}

function updateLoginButton() {
  const loginEl = document.querySelector('.login')
  const logoutEl = document.querySelector('.logout')
  if (localStorage.getItem('token')) {
    // 로그인 버튼 띄우고
    loginEl.classList.remove('hidden')
    // 로그아웃 버튼 숨기기
    logoutEl.classList.add('hidden')
  } else {
    logoutEl.classList.remove('hidden')
    // ..
    loginEl.classList.add('hidden')
  }
}

updateLoginButton()


//*************************************************** */

// async function drawLoginForm() {
//   // 1. 템플릿 복사
//   const frag = document.importNode(templates.loginForm, true)

//   // 2. 요소 선택
//   const formEl = frag.querySelector('.login-form')

//   // 3. 필요한 데이터 불러오기 - 필요없음
//   // 4. 내용 채우기 - 필요없음
//   // 5. 이벤트 리스너 등록하기
//   formEl.addEventListener('submit', async e => {
//     e.preventDefault()
//     const username = e.target.elements.username.value
//     const password = e.target.elements.password.value

//     const res = await api.post('/users/login', {
//       username,
//       password
//     })

//     localStorage.setItem('token', res.data.token)
//     drawPostList()
//   })

//   // 6. 템플릿을 문서에 삽입
//   rootEl.textContent = ''
//   rootEl.appendChild(frag)
// }

// drawLoginForm()

// async function drawPostList() {
//   // 1. 템플릿 복사
//   const frag = document.importNode(templates.postList, true)

//   // 2. 요소 선택
//   const listEl = frag.querySelector('.post-list')
  // const createEl = frag.querySelector('.create')
  // 3. 필요한 데이터 불러오기
  // const {data: postList} = await api.get('/posts?_expand=user')


  // 4. 내용 채우기
  // for (const postItem of postList){
  //   const frag = document.importNode(templates.postItem, true)

  //   const idEl = frag.querySelector('.id')
  //   const titleEl = frag.querySelector('.title')
  //   const authorEl = frag.querySelector('.author')

  //   idEl.textContent = postItem.id
  //   titleEl.textContent = postItem.title
  //   authorEl.textContent = postItem.user.username

    // titleEl.addEventListener('click', e=>{
    //   drawPostDetail(postItem.id)
    // })

    // listEl.appendChild(frag)
  // }

  // 5. 이벤트 리스너 등록하기
  // createEl.addEventListener('click', e => {
  //   drawNewPostForm()
  // })

  // 6. 템플릿을 문서에 삽입
  // rootEl.textContent = ''
  // rootEl.appendChild(frag)
// }
