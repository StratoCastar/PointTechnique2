'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');
const follow = require('./follow');

// const root = 'http://localhost:8081';


class App extends React.Component {


	constructor(props) {
		super(props);
		this.state = { sushis: [], attributes: [], pageSize: 2, links: {} };
		this.updatePageSize = this.updatePageSize.bind(this);
		this.onCreate = this.onCreate.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onNavigate = this.onNavigate.bind(this);
		this.onUpdate = this.onUpdate.bind(this);
	}



	componentDidMount() {
		this.discoverAndLoad();

	}

	discoverAndLoad() {
		fetch('http://localhost:9000/eureka/apps/sushi-back', { headers: { "Accept": "application/json" } })
			.then(res => res.json())
			.then((data) => {
				//Round Robin de Gitan 
				const instanceId = Math.floor(Math.random() * Object.keys(data.application.instance).length)
				const generatedRoot = 'http://' + data.application.instance[instanceId].hostName + ':'
					+ data.application.instance[instanceId].port.$
				this.setState({ root: generatedRoot }, function () {
					this.loadFromServer(this.state.pageSize);
				})
			})
	}

	loadFromServer(pageSize) {

		console.log(this.state.root)
		follow(client, this.state.root, [
			{ rel: 'sushis', params: { size: pageSize } }]
		).then(sushiCollection => {
			return client({
				method: 'GET',
				path: sushiCollection.entity._links.profile.href,
				headers: { 'Accept': 'application/schema+json' }
			}).then(schema => {
				this.schema = schema.entity;
				this.links = sushiCollection.entity._links;
				return sushiCollection;
			});
		}).then(sushiCollection => {
			return sushiCollection.entity._embedded.sushis.map(sushi => client({ method: 'GET', path: sushi._links.self.href }));
		}).then(sushiPromises => {
			return Promise.all(sushiPromises);

		}).done(sushis => {
			this.setState({
				sushis: sushis,
				attributes: Object.keys(this.schema.properties),
				pageSize: pageSize,
				links: this.links
			});
		});
	}

	render() {
		return (
			<div>
				<CreateDialog attributes={this.state.attributes} onCreate={this.onCreate} />
				<SushiList sushis={this.state.sushis}
					links={this.state.links}
					pageSize={this.state.pageSize}
					attributes={this.state.attributes}
					onNavigate={this.onNavigate}
					onUpdate={this.onUpdate}
					onDelete={this.onDelete}
					updatePageSize={this.updatePageSize} />
			</div>
		)
	}



	onNavigate(navUri) {
		client({
			method: 'GET',
			path: navUri
		}).then(sushiCollection => {
			this.links = sushiCollection.entity._links;

			return sushiCollection.entity._embedded.sushis.map(sushi =>
				client({
					method: 'GET',
					path: sushi._links.self.href
				})
			);
		}).then(sushiPromises => {
			return Promise.all(sushiPromises);
		}).done(sushis => {
			this.setState({
				sushis: sushis,
				attributes: Object.keys(this.schema.properties),
				pageSize: this.state.pageSize,
				links: this.links
			});
		});
	}


	onCreate(newSushi) {
		follow(client, this.state.root, ['sushis']).then(sushiCollection => {
			return client({
				method: 'POST',
				path: sushiCollection.entity._links.self.href,
				entity: newSushi,
				headers: { 'Content-Type': 'application/json' }
			})
		}).then(response => {
			return follow(client, this.state.root, [
				{ rel: 'sushis', params: { 'size': this.state.pageSize } }]);
		}).done(response => {
			if (typeof response.entity._links.last !== "undefined") {
				this.onNavigate(response.entity._links.last.href);
			} else {
				this.onNavigate(response.entity._links.self.href);
			}
		});
	}

	onDelete(sushi) {
		client({ method: 'DELETE', path: sushi.entity._links.self.href }).done(response => {
			this.loadFromServer(this.state.pageSize);
		});
	}

	updatePageSize(pageSize) {
		if (pageSize !== this.state.pageSize) {
			this.loadFromServer(pageSize);
		}
	}

	onUpdate(sushi, updatedSushi) {
		client({
			method: 'PUT',
			path: sushi.entity._links.self.href,
			entity: updatedSushi,
			headers: {
				'Content-Type': 'application/json',
				'If-Match': sushi.headers.Etag
			}
		}).done(response => {
			this.loadFromServer(this.state.pageSize);
		}, response => {
			if (response.status.code === 412) {
				alert('DENIED: Unable to update ' +
					sushi.entity._links.self.href + '. Your copy is stale.');
			}
		});
	}

}
class SushiList extends React.Component {

	constructor(props) {
		super(props);
		this.handleNavFirst = this.handleNavFirst.bind(this);
		this.handleNavPrev = this.handleNavPrev.bind(this);
		this.handleNavNext = this.handleNavNext.bind(this);
		this.handleNavLast = this.handleNavLast.bind(this);
		this.handleInput = this.handleInput.bind(this);
	}

	// tag::handle-page-size-updates[]
	handleInput(e) {
		e.preventDefault();
		const pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
		if (/^[0-9]+$/.test(pageSize)) {
			this.props.updatePageSize(pageSize);
		} else {
			ReactDOM.findDOMNode(this.refs.pageSize).value =
				pageSize.substring(0, pageSize.length - 1);
		}
	}
	// end::handle-page-size-updates[]

	// tag::handle-nav[]
	handleNavFirst(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.first.href);
	}

	handleNavPrev(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.prev.href);
	}

	handleNavNext(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.next.href);
	}

	handleNavLast(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.last.href);
	}

	render() {
		var sushis;
		if (this.props.sushis) {
			sushis = this.props.sushis.map(sushi =>
				<Sushi key={sushi.entity._links.self.href}
					sushi={sushi}
					attributes={this.props.attributes}
					onUpdate={this.props.onUpdate}
					onDelete={this.props.onDelete} />
			);
		}
		else {
			sushis = [];
		}
		const navLinks = [];
		if (this.props.links && this.props.links.first) {
			navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
		}
		if (this.props.links && this.props.links.prev) {
			navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
		}
		if (this.props.links && this.props.links.next) {
			navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
		}
		if (this.props.links && this.props.links.last) {
			navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
		}
		return (
			<div>
				<input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput} />
				<table>
					<tbody>
						<tr>
							<th>Sushi Name</th>
							<th>Sushi Price</th>
							<th></th>
							<th></th>
						</tr>
						{sushis}
					</tbody>
				</table>
				<div>
					{navLinks}
				</div>
			</div>
		)
	}
}

class Sushi extends React.Component {

	constructor(props) {
		super(props);
		this.handleDelete = this.handleDelete.bind(this);
	}

	handleDelete() {
		this.props.onDelete(this.props.sushi);
	}

	render() {
		return (
			<tr>
				<td>{this.props.sushi.entity.name}</td>
				<td>{this.props.sushi.entity.price}</td>
				<td>
					<UpdateDialog
						sushi={this.props.sushi}
						attributes={this.props.attributes}
						onUpdate={this.props.onUpdate} />
				</td>
				<td>
					<button onClick={this.handleDelete}>Delete</button>
				</td>
			</tr>
		)
	}
}



class CreateDialog extends React.Component {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		e.preventDefault();
		const newSushi = {};
		this.props.attributes.forEach(attribute => {
			newSushi[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
		});
		this.props.onCreate(newSushi);

		// clear out the dialog's inputs
		this.props.attributes.forEach(attribute => {
			ReactDOM.findDOMNode(this.refs[attribute]).value = '';
		});

		// Navigate away from the dialog to hide it.
		window.location = "#";
	}

	render() {
		const inputs = this.props.attributes.map(attribute =>
			<p key={attribute}>
				<input type="text" placeholder={attribute} ref={attribute} className="field" />
			</p>
		);

		return (
			<div>
				<a href="#createSushi">Create</a>

				<div id="createSushi" className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X</a>

						<h2>Create new delicious SuShi</h2>

						<form>
							{inputs}
							<button onClick={this.handleSubmit}>Create</button>
						</form>
					</div>
				</div>
			</div>
		)
	}

}

class UpdateDialog extends React.Component {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		e.preventDefault();
		const updatedSushi = {};
		this.props.attributes.forEach(attribute => {
			updatedSushi[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
		});;
		this.props.onUpdate(this.props.sushi, updatedSushi);
		window.location = "#";
	}

	render() {
		const inputs = this.props.attributes.map(attribute =>
			<p key={this.props.sushi.entity[attribute]}>
				<input type="text" placeholder={attribute}
					defaultValue={this.props.sushi.entity[attribute]}
					ref={attribute} className="field" />
			</p>
		);

		const dialogId = "updateSushi-" + this.props.sushi.entity._links.self.href;

		return (
			<div key={this.props.sushi.entity._links.self.href}>
				<a href={"#" + dialogId}>Update</a>
				<div id={dialogId} className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X</a>

						<h2>Update a yummy Sushi</h2>

						<form>
							{inputs}
							<button onClick={this.handleSubmit}>Update</button>
						</form>
					</div>
				</div>
			</div>
		)
	}

};

ReactDOM.render(
	<App />,
	document.getElementById('react')
)