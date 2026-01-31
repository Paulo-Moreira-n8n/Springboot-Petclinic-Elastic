
import React, { useEffect } from 'react';
import { APMService, punish } from '../main';

const WelcomePage: React.FC = () => {
  useEffect(() => {
    APMService.getInstance().startTransaction('WelcomePage');
    punish();
    APMService.getInstance().endTransaction(true);

    return () => {
      APMService.getInstance().endTransaction(false);
    };
  }, []);

  return (
    <span>
      <h2>Welcome</h2>
      <div className="row">
        <div className="col-md-12">
          <img className="img-responsive" src="/images/pets.png" />
        </div>
      </div>
    </span>
  );
};

export default WelcomePage;
