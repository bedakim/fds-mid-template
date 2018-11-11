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
  cartList: document.querySelector('#cart-list').content,
  cartItem: document.querySelector('#cart-item').content,
}

const rootEl = document.querySelector('.root')
// 페이지 그리는 함수 작성 순서
// 1. 템플릿 복사
// 2. 요소 선택
// 3. 필요한 데이터 불러오기
// 4. 내용 채우기
// 5. 이벤트 리스너 등록하기
// 6. 템플릿을 문서에 삽입

// 헤더이벤트
const loginEl = document.querySelector('.login')
const logoutEl = document.querySelector('.logout')
const signupEl = document.querySelector('.signup')
const logoEl = document.querySelector('.logo')
const cartEl = document.querySelector('.cart')

// 로그인시 그릴 화면
// if (localStorage.getItem('token')){
//   // drawMain()
//   updateLoginButton()
// }else{
//   updateLoginButton()
// }

function updateLoginButton() {
  const loginEl = document.querySelector('.login')
  const logoutEl = document.querySelector('.logout')
  if (localStorage.getItem('token')) {
    // 로그인 버튼 띄우고
    loginEl.classList.add('hidden')
    // 로그아웃 버튼 숨기기
    logoutEl.classList.remove('hidden')
  } else {
    logoutEl.classList.add('hidden')
    // ..
    loginEl.classList.remove('hidden')
  }
}

updateLoginButton()



logoEl.addEventListener('click',  e => {
  e.preventDefault()
  drawMain()
})

loginEl.addEventListener('click', async e => {
  e.preventDefault()
  drawLogin()
})
logoutEl.addEventListener('click', e => {
  localStorage.removeItem('token')
  drawMain()
})

signupEl.addEventListener('click', async e => {
  e.preventDefault()
  drawSignUp()
})

cartEl.addEventListener('click',  async e => {
  e.preventDefault()
  drawCartList()
})
//헤더 끝

//장바구니

async function drawCartList() {
  // 1. 템플릿 복사
  const frag = document.importNode(templates.cartList, true)

  // 2. 요소 선택
  const cartListEl = frag.querySelector('.cart-list')
  const checkboxAllEl = frag.querySelector('.checkbox-all')
  const orderEl = frag.querySelector('.order')

  // 3. 필요한 데이터 불러오기
  const { data: cartItemList } = await api.get('/cartItems', {
    params: {
      ordered: 'false'
    }
  })

  const optionIds = cartItemList.map(c => c.optionId)
  const params = new URLSearchParams()
  optionIds.forEach(optionId => params.append('id', optionId))
  params.append('_expand', 'product')
  const { data: optionList } = await api.get('/options', {
    params
  })

  // 4. 내용 채우기
  function updateCheckboxAll() {
    const checkboxEls = Array.from(cartListEl.querySelectorAll('.checkbox'))
    // 전부 체크되어 있다면, checkbox-all도 체크된 상태로 바꾸어줌
    if (checkboxEls.every(el => el.checked)) {
      checkboxAllEl.checked = true
    } else {
      checkboxAllEl.checked = false
    }
  }
  for (const cartItem of cartItemList) {
    const frag = document.importNode(templates.cartItem, true)

    const mainImageEl = frag.querySelector('.main-image')
    const titleEl = frag.querySelector('.title')
    const optionEl = frag.querySelector('.option')
    const quantityEl = frag.querySelector('.quantity')
    const quantityFormEl = frag.querySelector('.quantity-form')
    const priceEl = frag.querySelector('.price')
    const deleteEl = frag.querySelector('.delete')
    const checkboxEl = frag.querySelector('.checkbox')

    const option = optionList.find(o => o.id === cartItem.optionId)

    const price = parseInt(cartItem.quantity) * option.price
    mainImageEl.setAttribute('src', option.product.mainImgUrl)
    titleEl.textContent = option.product.title
    optionEl.textContent = option.title
    quantityEl.value = cartItem.quantity
    priceEl.textContent = `${price.toLocaleString()}원`
    checkboxEl.setAttribute('data-id', cartItem.id)
    // 혹은 이렇게 해도 됨: checkboxEl.dataset.id = cartItem.id

    quantityFormEl.addEventListener('submit', async e => {
      e.preventDefault()
      const quantity = parseInt(e.target.elements.quantity.value)
      if (Number.isNaN(quantity)) {
        alert('수량이 잘못되었습니다. 다시 확인해주십시오.')
        return
      }
      if (confirm('정말 수정하시겠습니까?')) {
        await api.patch(`/cartItems/${cartItem.id}`, {
          quantity
        })
        drawCartList()
      }
    })

    deleteEl.addEventListener('click', async e => {
      if (confirm('정말 삭제하시겠습니까?')) {
        await api.delete(`/cartItems/${cartItem.id}`)
        drawCartList()
      }
    })

    checkboxEl.addEventListener('click', e => {
      updateCheckboxAll()
    })

    cartListEl.appendChild(frag)
  }

  // 5. 이벤트 리스너 등록하기
  checkboxAllEl.addEventListener('click', e => {
    const checkboxEls = Array.from(cartListEl.querySelectorAll('.checkbox'))
    if (e.target.checked) {
      checkboxEls.forEach(el => el.checked = true)
    } else {
      checkboxEls.forEach(el => el.checked = false)
    }
  })

  orderEl.addEventListener('click', async e => {
    const checkboxEls = Array.from(cartListEl.querySelectorAll('.checkbox'))
    const selectedIds = checkboxEls
      .filter(el => el.checked)
      .map(el => parseInt(el.getAttribute('data-id')))
    // 혹은 이렇게 해도 됨: .map(el => parseInt(el.dataset.id))

    const { data: { id: orderId } } = await api.post('/orders', {
      orderTime: Date.now()
    })

    await Promise.all(selectedIds.map(cartItemId => {
      return api.patch(`/cartItems/${cartItemId}`, {
        ordered: true,
        orderId
      })
    }))

    if (confirm('주문이 완료되었습니다. 주문 내역을 확인하시겠습니까?')) {
      drawOrderList()
    } else {
      drawCartList()
    }
  })

  // 6. 템플릿을 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(frag)
}


//메인화면
async function drawMain() {
  // 1. 템플릿 복사
  const img = document.importNode(templates.mainImg, true)
  const category = document.importNode(templates.category, true)
  const frag = document.importNode(templates.itemList, true)
  // 2. 요소 선택
  const listEl = frag.querySelector('.item-list')
  // 뻘짓..
  const allEl = category.querySelector('.all')
  const uniformEl = category.querySelector('.uniform')
  const capEl = category.querySelector('.cap')
  const accEl = category.querySelector('.acc')
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
allEl.addEventListener('click', e => {
  drawMain()
})

uniformEl.addEventListener('click', e => {
  drawUniform()
})

capEl.addEventListener('click', e => {
  drawCap()
})

accEl.addEventListener('click', e => {
  drawAcc()
})

  // 6. 템플릿을 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(img)
  rootEl.appendChild(category)
  rootEl.appendChild(frag)
}
drawMain()


//카테고리 노가다 왜 이렇게 만들었을까...
async function drawUniform() {

// 1. 템플릿 복사
const img = document.importNode(templates.mainImg, true)
const category = document.importNode(templates.category, true)
const frag = document.importNode(templates.itemList, true)
// 2. 요소 선택
const listEl = frag.querySelector('.item-list')
const allEl = category.querySelector('.all')
  const uniformEl = category.querySelector('.uniform')
  const capEl = category.querySelector('.cap')
  const accEl = category.querySelector('.acc')
// 3. 필요한 데이터 불러오기
const {data: itemList} = await api.get('/products?id=1&id=2&id=3')
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
allEl.addEventListener('click', e => {
  drawMain()
})

uniformEl.addEventListener('click', e => {
  drawUniform()
})

capEl.addEventListener('click', e => {
  drawCap()
})

accEl.addEventListener('click', e => {
  drawAcc()
})
// 6. 템플릿을 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(img)
  rootEl.appendChild(category)
  rootEl.appendChild(frag)
}

async function drawCap() {// 1. 템플릿 복사
  const img = document.importNode(templates.mainImg, true)
  const category = document.importNode(templates.category, true)
  const frag = document.importNode(templates.itemList, true)
  // 2. 요소 선택
  const listEl = frag.querySelector('.item-list')
  const allEl = category.querySelector('.all')
  const uniformEl = category.querySelector('.uniform')
  const capEl = category.querySelector('.cap')
  const accEl = category.querySelector('.acc')
  // 3. 필요한 데이터 불러오기
  const {data: itemList} = await api.get('/products?id=4&id=5&id=6')
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
  allEl.addEventListener('click', e => {
    drawMain()
  })

  uniformEl.addEventListener('click', e => {
    drawUniform()
  })

  capEl.addEventListener('click', e => {
    drawCap()
  })

  accEl.addEventListener('click', e => {
    drawAcc()
  })
  // 6. 템플릿을 문서에 삽입
    rootEl.textContent = ''
    rootEl.appendChild(img)
    rootEl.appendChild(category)
    rootEl.appendChild(frag)
  }

async function drawAcc() {// 1. 템플릿 복사
  const img = document.importNode(templates.mainImg, true)
  const category = document.importNode(templates.category, true)
  const frag = document.importNode(templates.itemList, true)
  // 2. 요소 선택
  const listEl = frag.querySelector('.item-list')
  const allEl = category.querySelector('.all')
  const uniformEl = category.querySelector('.uniform')
  const capEl = category.querySelector('.cap')
  const accEl = category.querySelector('.acc')
  // 3. 필요한 데이터 불러오기
  const {data: itemList} = await api.get('/products?id=7&id=8&id=9')
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
  allEl.addEventListener('click', e => {
    drawMain()
  })

  uniformEl.addEventListener('click', e => {
    drawUniform()
  })

  capEl.addEventListener('click', e => {
    drawCap()
  })

  accEl.addEventListener('click', e => {
    drawAcc()
  })
  // 6. 템플릿을 문서에 삽입
    rootEl.textContent = ''
    rootEl.appendChild(img)
    rootEl.appendChild(category)
    rootEl.appendChild(frag)
  }

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
const mainImageEl = frag.querySelector('.item-img')
const detailImageListEl = frag.querySelector('.item-detail-img')
const titleEl = frag.querySelector('.dt-title')
const priceEl = frag.querySelector('.dt-price')
const descriptionEl = frag.querySelector('.dt-description')
const cartFormEl = frag.querySelector('.cart-form')
const selectEl = frag.querySelector('.option')
const quantityEl = frag.querySelector('.quantity')

// 3. 필요한 데이터 불러오기
const { data: { title, description, mainImgUrl, detailImgUrls, options}
} = await api.get(`/products/${productId}`, {
  params: {
    _embed: 'options'
  }
})
// 4. 내용 채우기

// titleEl.textContent = itemData.title
// priceEl.textContent = itemData.price
// descriptionEl.textContent = itemData.description
// mainImgEl.setAttribute('src',itemData.mainImgUrl)

// for ( const imgUrl of itemData.detailImgUrls){
//   // 1. 템플릿 복사
//   const frag = document.importNode(templates.itemDetailImg, true);
//   // 2. 요소 선택
//   const dtImg = frag.querySelector('.dt-img')
//   // 3. 필요한 데이터 불러오기
//   // 4. 내용 채우기
//   dtImg.setAttribute('src', imgUrl)
//   // 5. 이벤트 리스너 등록하기
//   // 6. 템플릿을 문서에 삽입
//   itemDetailEl.appendChild(frag)
// }
  mainImageEl.setAttribute('src', mainImgUrl)
  titleEl.textContent = title
  descriptionEl.textContent = description

  for (const url of detailImgUrls) {
    const frag = document.importNode(templates.itemDetailImg, true)

    const detailImageEl = frag.querySelector('.dt-img')

    detailImageEl.setAttribute('src', url)

    detailImageListEl.appendChild(frag)
  }

  for (const { id, title, price } of options) {
    const optionEl = document.createElement('option')
    optionEl.setAttribute('value', id)
    optionEl.textContent = `${title} (${price}원)`
    selectEl.appendChild(optionEl)
  }

// 5. 이벤트 리스너 등록하기
function calculateTotal() {
  // 선택된 option 태그에 해당하는 옵션 객체를 찾는다.
  const optionId = parseInt(selectEl.value)
  const option = options.find(o => o.id === optionId)
  // 찾지 못하면 함수를 종료시킨다.
  if (!option) return
  // 수량을 가져온다.
  const quantity = parseInt(quantityEl.value)
  // 총액을 계산해서 표시한다.
  const price = option.price * quantity
  priceEl.textContent = `${price.toLocaleString()}원`
}
selectEl.addEventListener('change', calculateTotal)
quantityEl.addEventListener('input', calculateTotal)

cartFormEl.addEventListener('submit', async e => {
  e.preventDefault()
  const optionId = parseInt(selectEl.value)
  const quantity = parseInt(quantityEl.value)

  // 이미 장바구니에 같은 상품이 들어있는지 확인
  const { data: orderedCartItems } = await api.get('/cartItems', {
    params: {
      ordered: false,
      optionId
    }
  })
  if (orderedCartItems.length > 0) {
    if (confirm('이미 장바구니에 같은 상품이 존재합니다. 장바구니로 이동하시겠습니까?')) {
      drawCartList()
    }
  } else {
    await api.post('/cartItems', {
      optionId,
      quantity,
      ordered: false
    })
    if (confirm('장바구니에 담긴 상품을 확인하시겠습니까?')) {
      drawCartList()
    }
  }
})

// 6. 템플릿을 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(frag)
}




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
