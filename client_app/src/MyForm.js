// src/MyForm.js
import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  CircularProgress, 
  Box, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select, 
  Grid, 
  Tabs, 
  Tab, 
  Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper 
} from '@mui/material';
import axios from 'axios';
import './MyForm.css'; // Import your CSS for the overlay
import ReactJson from 'react-json-view'
import {JsonTable} from 'react-json-to-html';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const MyForm = () => {

  const [inputValue, setInputValue] = useState('');

  const [parkId, setParkId] = useState('');
  
  const [selectedOption, setSelectedOption] = useState('en');

  const [username, setUsername] = useState('Sutikhna.nayak@gmail.com');

  const [password, setPassword] = useState('Roompotlandal.com');

  const [loading, setLoading] = useState(false);

  const [responseData, setResponseData] = useState(null);

  const [loginResponseData, setLoginResponseData] = useState(null);

  const [extractResponseData, setExtractResponseData] = useState(null);

  const [tabValue, setTabValue] = useState(0);

  const [topTabValue, setTopTabValue] = useState(0);


  const handleTextChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleUsername = (event) => {
    setUsername(event.target.value);
  };

  const handlePassword = (event) => {
    setPassword(event.target.value);
  };

  const handleParkId = (event) => {
    setParkId(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTopTabChange = (event, newValue) => {
    setTabValue(0)
    setTopTabValue(newValue);
  };

  const handleSelectChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setResponseData(null);

    try {
      const response = await axios.get(`http://localhost:3003`, {
        params: {
          parkName: inputValue,
          lang: selectedOption,
        },
      });
      setResponseData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setResponseData(null);

    try {
      const response = await axios.post(`http://localhost:3003/login`, {
        username,
        password,
        lang: selectedOption,
      });
      setLoginResponseData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setResponseData(null);

    try {
      const response = await axios.get(`http://localhost:3003/extract-cotnent`, {
        params: {
          parkId: parkId
        },
      });
      setExtractResponseData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadJson = (item) => {

    const dataStr = JSON.stringify(item.data, null, 2); // Convert JSON to string
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', item.file); // File name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  
  const downloadZIP = (parkId) => {

      const zip = new JSZip();

      const list = extractResponseData?.list;
      list.forEach(element => {
        zip.file(element.file, JSON.stringify(element.data, null, 2));
      });

      // Generate the zip file
      zip.generateAsync({ type: 'blob' }).then((content) => {
          saveAs(content, `Park_${parkId}.zip`); // Save the zip file
      });
  };

  return (
    <Box sx={{ mx: 'auto', mt: 4 }}>

      <Grid container spacing={2} alignItems="center">  
      <Grid item xs={4}>
        <FormControl fullWidth>
          <InputLabel id="select-label">Select Language</InputLabel>
          <Select
            labelId="select-label"
            value={selectedOption}
            onChange={handleSelectChange}
            label="Select an Option"
            disabled={topTabValue === 2 }
          >
            <MenuItem value="en">EN</MenuItem>
            <MenuItem value="nl">NL</MenuItem>
            <MenuItem value="de">DE</MenuItem>
            <MenuItem value="fr">FR</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      </Grid>

      <Tabs value={topTabValue} onChange={handleTopTabChange}>
          <Tab label="Park Detail" />
          <Tab label="Reservation Detail" />
          <Tab label="Extract Content" />
      </Tabs>

      { topTabValue === 0 && (
      
        <div style={{marginTop: 20}}> 
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={4}>
              <TextField
                label="Enter Park Name"
                variant="outlined"
                fullWidth
                value={inputValue}
                onChange={handleTextChange}
                InputProps={{
                  style: { textAlign: 'left' } // Align text left
                }}
              />
            </Grid>
          
            <Grid item xs={4}>
              <Button variant="contained" color="primary" onClick={handleSubmit} type="button" disabled={loading || inputValue === '' || selectedOption === ''} fullWidth>
                Find Details
              </Button>
            </Grid>
          </Grid>
        </div>)

      }
      
      { topTabValue === 1 && (
     
        <div style={{marginTop: 20}}> 
          <form >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={4}>
                <TextField
                  label="Enter Username"
                  variant="outlined"
                  fullWidth
                  value={username}
                  onChange={handleUsername}
                  InputProps={{
                    style: { textAlign: 'left' } // Align text left
                  }}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  label="Enter Password"
                  variant="outlined"
                  fullWidth
                  type='password'
                  value={password}
                  onChange={handlePassword}
                  InputProps={{
                    style: { textAlign: 'left' } // Align text left
                  }}
                />
              </Grid>
            
              <Grid item xs={4}>
                <Button variant="contained" color="primary" onClick={handleLoginSubmit} type="button" disabled={loading || username === '' || password === ''} fullWidth>
                  Login
                </Button>
              </Grid>
            </Grid>
          </form>
        </div>) 
      
      }

      { 
        topTabValue === 2 && (
            
            <div style={{marginTop: 20}}> 
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={4}>
                  <TextField
                    label="Enter Park Id"
                    variant="outlined"
                    fullWidth
                    value={parkId}
                    onChange={handleParkId}
                    InputProps={{
                      style: { textAlign: 'left' } // Align text left
                    }}
                  />
                </Grid>
              
                <Grid item xs={4}>
                  <Button variant="contained" color="primary" onClick={handleExtractSubmit} type="button" disabled={loading || parkId === ''} fullWidth>
                    Get Details
                  </Button>
                </Grid>
              </Grid>
            </div>)

      }


      {loading && (
        <div className="overlay">
          <CircularProgress />
        </div>
      )}
      { topTabValue === 0 && responseData && (
        <Box sx={{ mt: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Raw Json" />
              <Tab label="Table Format" />
            </Tabs>
          {tabValue === 0 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1">Raw Response Data:</Typography>
              <ReactJson src={responseData} collapsed={1}/>
            </Box>
          )}
          {tabValue === 1 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1">Formatted Response Data:</Typography>
              <JsonTable json={responseData}  />
            </Box>
          )}
        </Box>
      )}

      

      { topTabValue === 1 && loginResponseData && (
        <Box sx={{ mt: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Raw Json" />
              <Tab label="Table Format" />
            </Tabs>
          {tabValue === 0 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1">Raw Response Data:</Typography>
              <ReactJson src={loginResponseData} collapsed={1}/>
            </Box>
          )}
          {tabValue === 1 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1">Formatted Response Data:</Typography>
              <JsonTable json={loginResponseData}  />
            </Box>
          )}
        </Box>
      )}    

      { topTabValue === 2 && extractResponseData &&  extractResponseData?.list?.length > 0 && (
        <div>
           <div style={{marginTop: 10, marginBottom: 10, display: 'flex', justifyContent: 'right'}}>
                <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={() => downloadZIP(extractResponseData?.parkId)}
                >
                    Download All Files
                </Button>
            </div>
          <Box sx={{ mt: 2, borderBottom: 1, borderColor: 'divider' }}>
              <TableContainer component={Paper} style={{ marginTop: '20px' }}>
                  <Table>
                      <TableHead>
                          <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Action</TableCell>
                            
                          </TableRow>
                      </TableHead>
                      <TableBody>
                          {
                            extractResponseData?.list.map((row, index) => (
                              <TableRow key={index}>
                                  <TableCell>{row.file}</TableCell>
                                  <TableCell>
                                  <Button 
                                          variant="contained" 
                                          color="secondary" 
                                          onClick={() => downloadJson(row)}>
                                          Download
                                      </Button>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </TableContainer>
          </Box>
        </div>
      )}
    </Box>
  );
};

export default MyForm;
