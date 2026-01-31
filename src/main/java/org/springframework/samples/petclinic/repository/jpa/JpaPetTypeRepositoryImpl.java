package org.springframework.samples.petclinic.repository.jpa;

import java.util.Collection;
import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataAccessException;
import org.springframework.samples.petclinic.model.PetType;
import org.springframework.samples.petclinic.repository.PetTypeRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * JPA implementation of the {@link PetTypeRepository} interface.
 */
@Repository
@Profile("jpa")
@Transactional(readOnly = true)
public class JpaPetTypeRepositoryImpl implements PetTypeRepository {

    @PersistenceContext
    private EntityManager em;

    @Override
    public PetType findById(int id) {
        return this.em.find(PetType.class, id);
    }

    @Override
    public Collection<PetType> findAll() throws DataAccessException {
        return this.em.createQuery("SELECT t FROM PetType t", PetType.class)
                      .getResultList();
    }

    @Override
    @Transactional
    public void save(PetType petType) throws DataAccessException {
        if (petType.getId() == null) {
            this.em.persist(petType);
        } else {
            this.em.merge(petType);
        }
    }

    @Override
    @Transactional
    public void delete(PetType petType) throws DataAccessException {
        if (petType == null || petType.getId() == null) {
            return;
        }

        final Integer typeId = petType.getId();

        // 1) Remover visitas de pets desse tipo (JPQL correta: usar propriedades, não nomes de coluna)
        this.em.createQuery("DELETE FROM Visit v WHERE v.pet.type.id = :typeId")
               .setParameter("typeId", typeId)
               .executeUpdate();

        // 2) Remover pets desse tipo
        this.em.createQuery("DELETE FROM Pet p WHERE p.type.id = :typeId")
               .setParameter("typeId", typeId)
               .executeUpdate();

        // 3) Remover o próprio tipo de forma segura (entidade gerenciada)
        PetType managed = this.em.contains(petType) ? petType : this.em.find(PetType.class, typeId);
        if (managed != null) {
            this.em.remove(managed);
        }
    }
}
