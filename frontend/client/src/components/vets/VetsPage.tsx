
import React, { useEffect, useRef, useState } from 'react';
import { xhr_request } from '../../util/index';
import { IVet } from '../../types/index';
import { APMService, punish } from '../../main';

const VetsPage: React.FC = () => {
  const initialRender = useRef(true);
  const [vets, setVets] = useState<IVet[] | undefined>([]);

  useEffect(() => {
    APMService.getInstance().startTransaction('VetsPage');
    punish();

    xhr_request('api/vets', (status, data) => {
      if (status < 400) {
        APMService.getInstance().startSpan('Page Render', 'react');
        setVets(data as IVet[]);
      }
    });

    return () => {
      APMService.getInstance().endSpan();
      APMService.getInstance().endTransaction(false);
    };
  }, []);

  useEffect(() => {
    if (initialRender.current) {
      APMService.getInstance().endSpan();
      APMService.getInstance().endTransaction(true);
      initialRender.current = false;
    }
  }, [vets]);

  if (!vets) return <h2>Veterinarians</h2>;

  return (
    <span>
      <h2>Veterinarians</h2>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>Specialties</th>
          </tr>
        </thead>
        <tbody>
          {vets.map((vet) => (
            <tr key={vet.id}>
              <td>{vet.firstName} {vet.lastName}</td>
              <td>{vet.specialties.length > 0 ? vet.specialties.map((s) => s.name).join(', ') : 'none'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </span>
  );
};

export default VetsPage;
