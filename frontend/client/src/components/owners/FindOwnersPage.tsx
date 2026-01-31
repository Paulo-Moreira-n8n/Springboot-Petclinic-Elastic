
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { IOwner } from '../../types/index';
import { xhr_request } from '../../util/index';
import { APMService, punish } from '../../main';
import OwnersTable from './OwnersTable';

const useFilterFromLocation = (location: ReturnType<typeof useLocation>) => {
  const params = new URLSearchParams(location.search);
  return params.get('lastName');
};

const FindOwnersPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialRender = useRef(true);

  const [owners, setOwners] = useState<IOwner[] | undefined>(undefined);
  const [filter, setFilter] = useState<string | null>(useFilterFromLocation(location));

  const fetchData = useCallback((f: string | null) => {
    const query = f ? encodeURIComponent(f) : '';
    const requestUrl = f && query !== '*' ? `api/owners/*/lastname/${query}` : 'api/owners';

    xhr_request(requestUrl, (status, data) => {
      if (status < 400) {
        APMService.getInstance().startSpan('Page Render', 'react');
        setOwners(data as IOwner[]);
      }
    });
  }, []);

  useEffect(() => {
    APMService.getInstance().startTransaction('FindOwnersPage');
    punish();
    fetchData(filter);

    return () => {
      APMService.getInstance().endSpan();
      APMService.getInstance().endTransaction(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reagir à mudança de querystring (ex.: lastName) e buscar novamente
  useEffect(() => {
    const f = useFilterFromLocation(location);
    setFilter(f);
    fetchData(f);

    if (initialRender.current) {
      APMService.getInstance().endSpan();
      APMService.getInstance().endTransaction(true);
      initialRender.current = false;
    }
  }, [location.search, fetchData]);

  const onFilterChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value);
  }, []);

  const submitSearchForm = useCallback(() => {
    APMService.getInstance().startTransaction('FindOwnersPage: Filter');
    navigate(`/owners/list?lastName=${encodeURIComponent(filter || '')}`);
  }, [navigate, filter]);

  return (
    <span>
      <section>
        <h2>Find Owners</h2>

        <form className="form-horizontal" onSubmit={(e) => { e.preventDefault(); submitSearchForm(); }}>
          <div className="form-group">
            <div className="control-group" id="lastName">
              <label className="col-sm-2 control-label">Last name </label>
              <div className="col-sm-10">
                <input
                  className="form-control"
                  name="filter"
                  value={filter || ''}
                  onChange={onFilterChange}
                  size={30}
                  maxLength={80}
                />
              </div>
            </div>
          </div>
          <div className="form-group">
            <div className="col-sm-offset-2 col-sm-10">
              <button type="button" onClick={submitSearchForm} className="btn btn-default">
                Find Owner
              </button>
            </div>
          </div>
        </form>
      </section>

      <OwnersTable owners={owners || []} />
      <Link className="btn btn-default" to="/owners/new">Add Owner</Link>
    </span>
  );
};

export default FindOwnersPage;
