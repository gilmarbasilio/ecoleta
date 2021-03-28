import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import './CreatePoint.css';
import logo from '../../assets/logo.svg';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import {TileLayer, Marker, MapContainer, useMapEvents, useMap } from 'react-leaflet';
import api from '../../services/api';
import axios from 'axios';
import { toast } from 'react-toastify';
import DropZone from '../../components/DropZone';

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface IBGEUFResponse {
  sigla: string;
}

interface IBGECityResponse {
  id: number;
  nome: string;
}

const CreatePoint: React.FC = () => {
  const history = useHistory();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [ufs, setUfs] = useState<string[]>([]);
  const [cities, setCities] = useState<IBGECityResponse[]>([]);

  const [selectedUF, setSelectedUF] = useState('0');
  const [selectedCity, setSelectedCity] = useState('0');
  const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
  const [formData, setSFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  });

  const [selectedFile, setSelectedFile] = useState<File>();

  useEffect(() => {
    async function getItems() {
      const response = await api.get('/items');

      setItems(response.data);
    }

    getItems();
  }, [])

  useEffect(() => {
    async function getState() {
      const response = await axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
      const ufInitial = response.data.map(uf => uf.sigla);
      setUfs(ufInitial);
    }

    getState();
  }, [])

  useEffect(() => {
    if(selectedUF === '0')
      return;

    async function getState() {
      const response = await axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`);
      setCities(response.data);
    }

    getState();
  }, [selectedUF])

  function handleSelectUF(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedUF(event.target.value);
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedCity(event.target.value);
  }


  function OnClick() {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setSelectedPosition([lat, lng]);
      },
    })
    return null
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const {name, value} = event.target;
    setSFormData({
      ...formData,
      [name]: value
    })
  }


  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const {latitude, longitude} = position.coords;
      setInitialPosition([latitude, longitude]);
    });
  }, [])


  function ChangeMapView({coords}: any) {
    const map = useMap();
    map.setView(coords, map.getZoom());
  
    return null;
  }

  function handleSelectItem(itemSelected: Item) {
    const alreadySelected = selectedItems.findIndex(item => item.id === itemSelected.id);

    if(alreadySelected >= 0) {
      const filteredItems = selectedItems.filter(item => item.id !== itemSelected.id);
      setSelectedItems(filteredItems);
    } else {
      setSelectedItems([...selectedItems, itemSelected]);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { name, email, whatsapp} = formData;
    const uf = selectedUF;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const items = selectedItems.map(item => item.id);

    const dataForm = new FormData();

    dataForm.append('name', name);
    dataForm.append('email', email); 
    dataForm.append('whatsapp', whatsapp);
    dataForm.append('uf', uf);
    dataForm.append('city', city); 
    dataForm.append('latitude', String(latitude));
    dataForm.append('longitude', String(longitude));
    dataForm.append('items', items.join(','));

    if(selectedFile) {
      dataForm.append('image', selectedFile);
    }
    
    const response = await api.post('/points', dataForm);
    
    if(response.data.id !== 0){
      toast.success('Ponto de coleta criado!');
      history.push('/');
    } else {
      toast.error('Algo deu errado, tente novamente');
    }
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta"/>

        <Link to="/">
         <FiArrowLeft /> Voltar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>Cadastro do ponto de coleta</h1>

        <DropZone onFileUploaded={setSelectedFile}/>

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input 
              type="text" 
              name="name"
              id="name"
              onChange={handleInputChange}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input 
                type="email" 
                name="email"
                id="email"
                onChange={handleInputChange}
              />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input 
                type="text" 
                name="whatsapp"
                id="whatsapp"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <MapContainer center={initialPosition} zoom={15}>
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker 
              position={selectedPosition}
            />
            <OnClick />
            <ChangeMapView coords={initialPosition}/>
          </MapContainer>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select name="uf" id="uf" value={selectedUF} onChange={handleSelectUF}>
                <option value="0">Selecione um UF</option>
                {ufs.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
            <div className="field">
            <label htmlFor="city">Cidade</label>
              <select name="city" id="city" value={selectedCity} onChange={handleSelectCity}>
                <option value="0">Selecione uma Cidade</option>
                {cities.map(city => (
                  <option key={city.id} value={city.nome}>{city.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Ítens de Coleta</h2>
            <span>Selecione um ou mais ítens abaixo</span>
          </legend>

          <ul className="items-grid">
            {items.map(item => (
              <li 
                key={String(item.id)} 
                className={selectedItems.includes(item) ? 'selected':''}
                onClick={() => handleSelectItem(item)}>
                <img src={item.image_url} alt={item.title}/>
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </fieldset>

        <button type="submit">
          Cadastrar ponto de coleta
        </button>

      </form>
    </div>


  );
}

export default CreatePoint;