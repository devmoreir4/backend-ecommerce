const Product = Parse.Object.extend('Product');
const Category = Parse.Object.extend('Category');

// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", (req) => {
	return "Hello world from Carlos!";
});

Parse.Cloud.define('get-product-list', async (req) => {
	const queryProducts = new Parse.Query(Product);

	//condictions

	if(req.params.title != null){
		queryProducts.fullText('title', req.params.title);
		//queryProducts.matches('title', '.*' + req.params.title + '.*');
	}

	if(req.params.categoryId != null) {
		const category = new Category();
		category.id = req.params.categoryId;

		queryProducts.equalTo('category', category);
	}

	const itemsPerPage = req.params.itemsPerPage || 10;
	if(itemsPerPage > 100) throw 'Invalid number of items per page';

	queryProducts.skip(itemsPerPage * req.params.page || 0);
	queryProducts.limit(itemsPerPage);

	queryProducts.include('category')

	const resultProducts = await queryProducts.find({useMasterKey: true});

	return resultProducts.map(function (p){
		p = p.toJSON();
		return{
			id: p.objectId,
			title: p.title,
			description: p.description,
			price: p.price,
			unit: p.unit,
			picture: p.picture != null ? p.picture.url : null,
			category: {
				title: p.category.title,
				id: p.category.objectId
			},
		}

	});
});

Parse.Cloud.define('get-category-list', async (req) => {
	const queryCategories = new Parse.Query(Category);

	//condições

	const resultCategories = await queryCategories.find({useMasterKey: true});
	return resultCategories.map(function (c) {
		c = c.toJSON();
		return {
			title: c.title,
			id: c.objectId
		}

	});
});

Parse.Cloud.define('signup', async (req) => {
	if(req.params.fullname == null) throw 'INVALID_FULLNAME';
	if(req.params.phone == null) throw 'INVALID_PHONE';
	if(req.params.cpf == null) throw 'INVALID_CPF';

	const user = new Parse.User();

	user.set('username', req.params.email);
	user.set('email', req.params.email);
	user.set('password', req.params.password);
	user.set('fullname', req.params.fullname);
	user.set('phone', req.params.phone);
	user.set('cpf', req.params.cpf);
	
	try{
		const resultUser = await user.signUp(null, {useMasterKey: true});
		const userJson = resultUser.toJSON();

		return formatUser(userJson);
	} catch (e) {
		throw 'INVALID_DATA';
	}
});

Parse.Cloud.define('signin', async (req) => {
	try{
		const user = await Parse.User.logIn(req.params.email, req.params.password);
		const userJson = user.toJSON();
		return formatUser(userJson);
	} catch (e) {
		throw 'INVALID_CREDENTIALS';
	}
});

Parse.Cloud.define('validate-token', async (req) => {
	try{
		return formatUser(req.user.toJSON());
	} catch (e) {
		throw 'INVALID_TOKEN';
	}
});

Parse.Cloud.define('change-password', async (req) => {
	if (req.user == null) throw 'INVALID_USER';

	const user = await Parse.User.logIn(req.params.email, req.params.currentPassword);
	if(user.id != req.user.id) throw 'INVALID_USER';
	user.set('password', req.params.newPassword);
	await user.save(null, {useMasterKey: true});
});

Parse.Cloud.define('reset-password', async (req) => {
	await Parse.User.requestPasswordReset(req.params.email);
});

function formatUser(userJson) {
	return {
		id: userJson.objectId,
		fullname: userJson.fullname,
		email: userJson.email,
		phone: userJson.phone,
		cpf: userJson.cpf,
		token: userJson.sessionToken,
	}
}