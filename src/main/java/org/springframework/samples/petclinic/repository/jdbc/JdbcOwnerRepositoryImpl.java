/*
 * Copyright 2002-2017 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


package org.springframework.samples.petclinic.repository.jdbc;

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.transaction.annotation.Transactional;

import co.elastic.apm.api.CaptureSpan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import org.springframework.orm.ObjectRetrievalFailureException;
import org.springframework.samples.petclinic.model.Owner;
import org.springframework.samples.petclinic.model.Pet;
import org.springframework.samples.petclinic.model.PetType;
import org.springframework.samples.petclinic.model.Visit;
import org.springframework.samples.petclinic.repository.OwnerRepository;
import org.springframework.samples.petclinic.util.EntityUtils;
import org.springframework.stereotype.Repository;

@Repository
@Profile("jdbc")
public class JdbcOwnerRepositoryImpl implements OwnerRepository {

    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    private final SimpleJdbcInsert insertOwner;

    @Autowired
    public JdbcOwnerRepositoryImpl(DataSource dataSource) {
        this.insertOwner = new SimpleJdbcInsert(dataSource)
            .withTableName("owners")
            .usingGeneratedKeyColumns("id");

        this.namedParameterJdbcTemplate = new NamedParameterJdbcTemplate(dataSource);
    }

    @Override
    public Collection<Owner> findByLastName(String lastName) throws DataAccessException {
        Map<String, Object> params = new HashMap<>();
        params.put("lastName", lastName + "%");
        List<Owner> owners = this.namedParameterJdbcTemplate.query(
            "SELECT id, first_name, last_name, address, city, telephone, state, zip_code " +
            "FROM owners WHERE last_name LIKE :lastName",
            params,
            BeanPropertyRowMapper.newInstance(Owner.class)
        );
        loadOwnersPetsAndVisits(owners);
        return owners;
    }

    @Override
    public Owner findById(int id) throws DataAccessException {
        try {
            Map<String, Object> params = new HashMap<>();
            params.put("id", id);
            Owner owner = this.namedParameterJdbcTemplate.queryForObject(
                "SELECT id, first_name, last_name, address, city, telephone, state, zip_code " +
                "FROM owners WHERE id = :id",
                params,
                BeanPropertyRowMapper.newInstance(Owner.class)
            );
            loadPetsAndVisits(owner);
            return owner;
        } catch (EmptyResultDataAccessException ex) {
            throw new ObjectRetrievalFailureException(Owner.class, id);
        }
    }

    /**
     * Carrega pets e visitas de um Owner.
     * Consulta pets primeiro e, para cada pet, carrega as visitas em uma segunda query.
     */
    public void loadPetsAndVisits(final Owner owner) throws DataAccessException {
        if (owner == null || owner.getId() == null) {
            return;
        }

        Map<String, Object> params = new HashMap<>();
        params.put("ownerId", owner.getId());

        // 1) Pets do Owner
        final List<JdbcPet> pets = this.namedParameterJdbcTemplate.query(
            "SELECT p.id AS pets_id, p.name, p.birth_date, p.type_id, p.owner_id " +
            "FROM pets p WHERE p.owner_id = :ownerId ORDER BY p.id",
            params,
            new JdbcPetRowMapper()
        );

        // Tipos de Pet para mapear type_id -> PetType
        Collection<PetType> petTypes = getPetTypes();

        for (JdbcPet pet : pets) {
            // Seta o PetType do pet
            pet.setType(EntityUtils.getById(petTypes, PetType.class, pet.getTypeId()));
            owner.addPet(pet);

            // 2) Visitas do pet
            Map<String, Object> vParams = Collections.singletonMap("petId", pet.getId());
            List<Visit> visits = this.namedParameterJdbcTemplate.query(
                "SELECT id, visit_date, description, pet_id FROM visits WHERE pet_id = :petId ORDER BY visit_date",
                vParams,
                new JdbcVisitRowMapper()
            );
            for (Visit v : visits) {
                pet.addVisit(v);
            }
        }
    }

    @Override
    @CaptureSpan(value = "save")
    public void save(Owner owner) throws DataAccessException {
        BeanPropertySqlParameterSource parameterSource = new BeanPropertySqlParameterSource(owner);
        if (owner.isNew()) {
            Number newKey = this.insertOwner.executeAndReturnKey(parameterSource);
            owner.setId(newKey.intValue());
        } else {
            this.namedParameterJdbcTemplate.update(
                "UPDATE owners SET first_name=:firstName, last_name=:lastName, address=:address, " +
                    "city=:city, telephone=:telephone, state=:state, zip_code=:zipCode WHERE id=:id",
                parameterSource
            );
        }
    }

    public Collection<PetType> getPetTypes() throws DataAccessException {
        return this.namedParameterJdbcTemplate.query(
            "SELECT id, name FROM types ORDER BY name",
            Collections.emptyMap(),
            BeanPropertyRowMapper.newInstance(PetType.class)
        );
    }

    private void loadOwnersPetsAndVisits(List<Owner> owners) throws DataAccessException {
        for (Owner owner : owners) {
            loadPetsAndVisits(owner);
        }
    }

    @Override
    public Collection<Owner> findAll() throws DataAccessException {
        List<Owner> owners = this.namedParameterJdbcTemplate.query(
            "SELECT id, first_name, last_name, address, city, telephone, state, zip_code FROM owners",
            Collections.emptyMap(),
            BeanPropertyRowMapper.newInstance(Owner.class)
        );
        for (Owner owner : owners) {
            loadPetsAndVisits(owner);
        }
        return owners;
    }

    @Override
    @Transactional
    public void delete(Owner owner) throws DataAccessException {
        if (owner == null || owner.getId() == null) return;

        Map<String, Object> ownerParams = new HashMap<>();
        ownerParams.put("id", owner.getId());

        // Carrega pets para deletar em cascata
        Map<String, Object> params = new HashMap<>();
        params.put("ownerId", owner.getId());
        final List<Pet> pets = this.namedParameterJdbcTemplate.query(
            "SELECT id, name, birth_date, type_id, owner_id FROM pets WHERE owner_id = :ownerId",
            params,
            new BeanPropertyRowMapper<>(Pet.class)
        );

        for (Pet pet : pets) {
            Map<String, Object> petParams = Collections.singletonMap("id", pet.getId());

            // Apaga visitas do pet
            this.namedParameterJdbcTemplate.update("DELETE FROM visits WHERE pet_id = :id", petParams);
            // Apaga o pet
            this.namedParameterJdbcTemplate.update("DELETE FROM pets WHERE id = :id", petParams);
        }

        // Por fim, apaga o owner
        this.namedParameterJdbcTemplate.update("DELETE FROM owners WHERE id = :id", ownerParams);
    }
}
