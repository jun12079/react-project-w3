import { useEffect, useRef, useState } from "react"
import axios from "axios"
import { Modal } from "bootstrap"

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

function App() {
	const defaultModalState = {
		imageUrl: "",
		title: "",
		category: "",
		unit: "",
		origin_price: "",
		price: "",
		description: "",
		content: "",
		is_enabled: 0,
		imagesUrl: [""]
	};

	const [isAuth, setIsAuth] = useState(false)
	const [account, setAccount] = useState({
		"username": "",
		"password": ""
	})

	const checkUserLogin = async () => {
		try {
			await axios.post(`${BASE_URL}/v2/api/user/check`);
			setIsAuth(true);
			getProducts();
		} catch (error) {
			console.log(error)
		}
	}

	const handleLoginInputChange = (e) => {
		const { name, value } = e.target;
		setAccount({
			...account,
			[name]: value
		})
	}

	const handleLogin = async (e) => {
		e.preventDefault()
		try {
			const res = await axios.post(`${BASE_URL}/v2/admin/signin`, account)
			const { token, expired } = res.data;
			document.cookie = `hexToken=${token}; expires=${new Date(expired)};`;
			axios.defaults.headers.common['Authorization'] = token;
			setIsAuth(true);
			getProducts();
		} catch (error) {
			console.log(error)
		}
	}

	useEffect(() => {
		const token = document.cookie.replace(/(?:(?:^|.*;\s*)hexToken\s*=\s*([^;]*).*$)|^.*$/, "$1");
		if (token) {
			axios.defaults.headers.common['Authorization'] = token;
			checkUserLogin();
		}
	}, []);

	const [products, setProducts] = useState([])
	const [tempProduct, setTempProduct] = useState(defaultModalState)

	const getProducts = async () => {
		try {
			const res = await axios.get(`${BASE_URL}/v2/api/${API_PATH}/admin/products`)
			setProducts(res.data.products)
		} catch (error) {
			console.log(error)
		}
	}

	const handleUpadteProduct = async () => {
		const apiCall = modalMode === 'create' ? createProduct : updateProduct;

		try {
			await apiCall();
			getProducts();
			handleCloseProductModal();
		} catch (error) {
			console.log(error)
			alert('更新產品失敗')
		}
	}

	const createProduct = async () => {
		try {
			await axios.post(`${BASE_URL}/v2/api/${API_PATH}/admin/product`, {
				data: {
					...tempProduct,
					origin_price: Number(tempProduct.origin_price),
					price: Number(tempProduct.price),
					is_enabled: tempProduct.is_enabled ? 1 : 0
				}
			})
		} catch (error) {
			console.log(error)
			alert('新增產品失敗')
		}
	}

	const updateProduct = async () => {
		try {
			await axios.put(`${BASE_URL}/v2/api/${API_PATH}/admin/product/${tempProduct.id}`, {
				data: {
					...tempProduct,
					origin_price: Number(tempProduct.origin_price),
					price: Number(tempProduct.price),
					is_enabled: tempProduct.is_enabled ? 1 : 0
				}
			})
		} catch (error) {
			console.log(error)
			alert('更新產品失敗')
		}
	}

	const handleDeleteProduct = async () => {
		try {
			await deleteProduct();
			getProducts();
			handleCloseDelProductModal();
		} catch (error) {
			console.log(error)
			alert('刪除產品失敗')
		}
	}

	const deleteProduct = async () => {
		try {
			await axios.delete(`${BASE_URL}/v2/api/${API_PATH}/admin/product/${tempProduct.id}`)
		} catch (error) {
			console.log(error)
		}
	}

	const handleImageChange = (e, index) => {
		const { value } = e.target;
		const newImagesUrl = [...tempProduct.imagesUrl];
		newImagesUrl[index] = value;
		setTempProduct({
			...tempProduct,
			imagesUrl: newImagesUrl
		})
	}

	const handleAddImage = () => {
		const newImagesUrl = [...tempProduct.imagesUrl, ""];
		setTempProduct({
			...tempProduct,
			imagesUrl: newImagesUrl
		})
	}

	const handleRemoveImage = () => {
		const newImagesUrl = [...tempProduct.imagesUrl];
		newImagesUrl.pop();

		setTempProduct({
			...tempProduct,
			imagesUrl: newImagesUrl
		})
	}

	const productModalRef = useRef(null);
	const delProductModalRef = useRef(null);
	const [modalMode, setModalMode] = useState(null);

	const handleModalInputChange = (e) => {
		const { name, value, checked, type } = e.target;
		setTempProduct({
			...tempProduct,
			[name]: type === 'checkbox' ? checked : value
		})
	}

	useEffect(() => {
		new Modal(productModalRef.current, { backdrop: 'static' });
		new Modal(delProductModalRef.current, { backdrop: 'static' });
		productModalRef.current.addEventListener('hidden.bs.modal', () => {
			if (document.activeElement instanceof HTMLElement) {
				document.activeElement.blur();
			}
		});
		delProductModalRef.current.addEventListener('hidden.bs.modal', () => {
			if (document.activeElement instanceof HTMLElement) {
				document.activeElement.blur();
			}
		});
	}, [])

	const handleOpenProductModal = (mode, product) => {
		setModalMode(mode);
		switch (mode) {
			case 'create':
				setTempProduct(defaultModalState);
				break;
			case 'edit':
				setTempProduct(product);
				break;
			default:
				break;
		}
		const modalInstance = Modal.getInstance(productModalRef.current);
		modalInstance.show();
	}

	const handleCloseProductModal = () => {
		const modalInstance = Modal.getInstance(productModalRef.current);
		modalInstance.hide();
	}

	const handleOpenDelProductModal = (product) => {
		setTempProduct(product);
		const modalInstance = Modal.getInstance(delProductModalRef.current);
		modalInstance.show();
	}

	const handleCloseDelProductModal = () => {
		const modalInstance = Modal.getInstance(delProductModalRef.current);
		modalInstance.hide();
	}

	return (
		<>
			{isAuth ?
				<div className="container mt-4">
					<div className="row mb-3">
						<div className="col">
							<h2>產品列表</h2>
						</div>
						<div className="col text-end">
							<button className="btn btn-primary" onClick={() => { handleOpenProductModal('create') }}>
								<i className="bi bi-plus"></i>新增產品
							</button>
						</div>
					</div>

					<table className="table table-hover">
						<thead className="table-light">
							<tr>
								<th>分類</th>
								<th>產品名稱</th>
								<th>原價</th>
								<th>售價</th>
								<th>是否啟用</th>
								<th>編輯</th>
							</tr>
						</thead>
						<tbody>
							{products.map((product) => (
								<tr key={product.id}>
									<td>{product.category}</td>
									<td>{product.title}</td>
									<td>${product.origin_price}</td>
									<td>${product.price}</td>
									<td>
										<span className={`badge ${product.is_enabled ? 'bg-success' : 'bg-secondary'}`}>
											{product.is_enabled ? '啟用' : '停用'}
										</span>
									</td>
									<td>
										<button className="btn btn-sm btn-warning me-1" onClick={() => { handleOpenProductModal('edit', product) }}>
											<i className="bi bi-pencil"></i> 編輯
										</button>
										<button className="btn btn-sm btn-danger" onClick={() => { handleOpenDelProductModal(product) }}>
											<i className="bi bi-trash"></i> 刪除
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				:
				<div className="container">
					<div className="row justify-content-center mt-5">
						<div className="col-6">
							<div className="card">
								<div className="card-body">
									<form onSubmit={handleLogin}>
										<div className="mb-3">
											<label htmlFor="username" className="form-label">Username</label>
											<input type="email" className="form-control" id="username" name="username" value={account.username} onChange={handleLoginInputChange} />
										</div>
										<div className="mb-3">
											<label htmlFor="password" className="form-label">Password</label>
											<input type="password" className="form-control" id="password" name="password" value={account.password} onChange={handleLoginInputChange} />
										</div>
										<button id="login" type="submit" className="btn btn-primary">登入</button>
									</form>
								</div>
							</div>
						</div>
					</div>
				</div>
			}

			<div ref={productModalRef} className="modal fade" id="productModal">
				<div className="modal-dialog modal-lg">
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title" id="productModalLabel">{modalMode === 'create' ? '新增產品' : '編輯產品'}</h5>
							<button type="button" className="btn-close" aria-label="Close" onClick={handleCloseProductModal}></button>
						</div>
						<div className="modal-body">
							<form>
								<div className="row mb-3">
									<div className="col-md-6">
										<div className="mb-3">
											<label htmlFor="imageUrl" className="form-label">主圖連結</label>
											<input type="url" className="form-control" id="imageUrl" name="imageUrl" placeholder="請輸入主圖連結" value={tempProduct.imageUrl} onChange={handleModalInputChange} />
											<img
												src={tempProduct.imageUrl}
												alt={tempProduct.title}
												className="img-fluid"
											/>
										</div>
										<div className="border border-2 border-dashed rounded-3 p-3">
											{tempProduct.imagesUrl?.map((image, index) => (
												<div key={index} className="mb-2">
													<label htmlFor={`imagesUrl-${index + 1}`} className="form-label">副圖 {index + 1}</label>
													<input
														value={image}
														onChange={(e) => handleImageChange(e, index)}
														id={`imagesUrl-${index + 1}`}
														type="text"
														placeholder={`圖片網址 ${index + 1}`}
														className="form-control mb-2"
													/>
													{image && (
														<img
															src={image}
															alt={`副圖 ${index + 1}`}
															className="img-fluid mb-2"
														/>
													)}
												</div>
											))}
											<div className="btn-group w-100">
												{tempProduct.imagesUrl.length < 5 && tempProduct.imagesUrl[tempProduct.imagesUrl.length - 1] !== "" && (<button type="button" className="btn btn-outline-primary btn-sm w-100" onClick={handleAddImage}>新增圖片</button>)}
												{tempProduct.imagesUrl.length > 1 && (<button type="button" className="btn btn-outline-danger btn-sm w-100" onClick={handleRemoveImage}>取消圖片</button>)}
											</div>

										</div>
									</div>
									<div className="col-md-6">
										<div className="mb-3">
											<label htmlFor="title" className="form-label">標題</label>
											<input type="text" className="form-control" id="title" name="title" placeholder="請輸入產品標題" value={tempProduct.title} onChange={handleModalInputChange} />
										</div>
										<div className="mb-3">
											<label htmlFor="category" className="form-label">分類</label>
											<input type="text" className="form-control" id="category" name="category" placeholder="請輸入產品分類" value={tempProduct.category} onChange={handleModalInputChange} />
										</div>
										<div className="mb-3">
											<label htmlFor="unit" className="form-label">單位</label>
											<input type="text" className="form-control" id="unit" name="unit" placeholder="請輸入單位" value={tempProduct.unit} onChange={handleModalInputChange} />
										</div>
										<div className="mb-3">
											<label htmlFor="origin_price" className="form-label">原價</label>
											<input type="number" className="form-control" id="origin_price" name="origin_price" placeholder="請輸入原價" value={tempProduct.origin_price} onChange={handleModalInputChange} />
										</div>
										<div className="mb-3">
											<label htmlFor="price" className="form-label">售價</label>
											<input type="number" className="form-control" id="price" name="price" placeholder="請輸入售價" value={tempProduct.price} onChange={handleModalInputChange} />
										</div>
										<div className="mb-3">
											<label htmlFor="description" className="form-label">產品描述</label>
											<textarea className="form-control" id="description" name="description" rows="3" placeholder="請輸入產品描述" value={tempProduct.description} onChange={handleModalInputChange}></textarea>
										</div>
										<div className="mb-3">
											<label htmlFor="content" className="form-label">說明內容</label>
											<textarea className="form-control" id="content" name="content" rows="3" placeholder="請輸入說明內容" value={tempProduct.content} onChange={handleModalInputChange}></textarea>
										</div>
										<div className="mb-3">
											<div className="form-check form-switch">
												<input className="form-check-input" type="checkbox" id="is_enabled" name="is_enabled" checked={tempProduct.is_enabled} onChange={handleModalInputChange} />
												<label className="form-check-label" htmlFor="is_enabled">是否啟用</label>
											</div>
										</div>
									</div>
								</div>
							</form>
						</div>
						<div className="modal-footer">
							<button type="button" className="btn btn-secondary" onClick={handleCloseProductModal}>取消</button>
							<button type="button" className="btn btn-primary" onClick={handleUpadteProduct}>確認</button>
						</div>
					</div>
				</div>
			</div>

			<div ref={delProductModalRef} className="modal fade" id="delProductModal" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
				<div className="modal-dialog">
					<div className="modal-content">
						<div className="modal-header">
							<h1 className="modal-title fs-5">刪除產品</h1>
							<button type="button" className="btn-close" aria-label="Close" onClick={handleCloseDelProductModal}></button>
						</div>
						<div className="modal-body">
							你是否要刪除<span className="text-danger fw-bold">{tempProduct.title}</span>
						</div>
						<div className="modal-footer">
							<button type="button" className="btn btn-secondary" onClick={handleCloseDelProductModal}>取消</button>
							<button type="button" className="btn btn-danger" onClick={handleDeleteProduct}>刪除</button>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default App
