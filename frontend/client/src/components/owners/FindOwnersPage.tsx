import * as React from 'react';
import { IRouter, Link } from 'react-router';
import { IOwner, IRouterContext } from '../../types/index';
import { request, xhr_request } from '../../util/index';
import { APMService, punish } from '../../main';
import OwnersTable from './OwnersTable';

interface IFindOwnersPageProps {
  location: HistoryModule.Location;
}

interface IFindOwnersPageState {
  owners?: IOwner[];
  filter?: string;
}

const getFilterFromLocation = (location) => {
  return location.query ? (location.query as any).lastName : null;
};

export default class FindOwnersPage extends React.Component<IFindOwnersPageProps, IFindOwnersPageState> {
  context: IRouterContext;
  initial_render: boolean;

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };



  constructor(props) {
    super(props);
    APMService.getInstance().startTransaction('FindOwnersPage');
    punish();
    this.initial_render = true;
    this.onFilterChange = this.onFilterChange.bind(this);
    this.submitSearchForm = this.submitSearchForm.bind(this);

    this.state = {
      filter: getFilterFromLocation(props.location)
    };
  }

  componentDidUpdate() {
    if (this.initial_render) {
      APMService.getInstance().endSpan();
      APMService.getInstance().endTransaction(true);
    }
    this.initial_render = false;
  }

  componentWillUnmount() {
    APMService.getInstance().endSpan();
    APMService.getInstance().endTransaction(false);
  }

  componentDidMount() {
    const { filter } = this.state;
    this.fetchData(filter);
  }

  componentWillReceiveProps(nextProps: IFindOwnersPageProps) {
    const { location } = nextProps;

    // read the filter from uri
    const filter = getFilterFromLocation(location);

    // set state
    this.setState({ filter });

    // load data according to filter
    this.fetchData(filter);
  }

  onFilterChange(event) {
    this.setState({
      filter: event.target.value as string
    });
  }

  /**
   * Invoked when the submit button was pressed.
   *
   * This method updates the URL with the entered lastName. The change of the URL
   * leads to new properties and thus results in rerending
   */
  submitSearchForm() {
    const { filter } = this.state;
    APMService.getInstance().startTransaction('FindOwnersPage: Filter');
    this.context.router.push({
      pathname: '/owners/list',
      query: { 'lastName': filter || '' }
    });
  }

  /**
   * Actually loads data from the server
   */
  fetchData(filter: string) {
    const query = encodeURIComponent(filter);
    const requestUrl = filter && query !== '*' ? 'api/owners/*/lastname/' + query : 'api/owners';
    xhr_request(requestUrl, (status, owners) =>  {
      if (status < 400) {
        APMService.getInstance().startSpan('Page Render', 'react');
        this.setState({ owners });
      }
    });
  }

  render() {
    const { filter, owners } = this.state;

    return (
      <span>
        <section>
          <h2>Find Owners</h2>

          <form className='form-horizontal' action='javascript:void(0)'>
            <div className='form-group'>
              <div className='control-group' id='lastName'>
                <label className='col-sm-2 control-label'>Last name </label>
                <div className='col-sm-10'>
                  <input className='form-control' name='filter' value={filter || ''} onChange={this.onFilterChange} size={30} maxLength={80} />
                  { /* <span className='help-inline'><form:errors path='*'/></span> TODO */}
                </div>
              </div>
            </div>
            <div className='form-group'>
              <div className='col-sm-offset-2 col-sm-10'>
                <button type='button' onClick={this.submitSearchForm} className='btn btn-default'>Find Owner</button>
              </div>
            </div>
          </form>
        </section>
        <OwnersTable owners={owners} />
        <Link className='btn btn-default' to='/owners/new'> Add Owner</Link>
      </span>
    );
  }
};
