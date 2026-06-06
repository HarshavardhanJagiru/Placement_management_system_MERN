import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#121833',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '1.5rem 0',
      marginTop: 'auto',
      textAlign: 'center',
      color: '#64748b',
      fontSize: '0.85rem'
    }}>
      <div className="container">
        &copy; {new Date().getFullYear()} Placement Management System. All rights reserved. Built with MERN Stack.
      </div>
    </footer>
  );
};

export default Footer;
