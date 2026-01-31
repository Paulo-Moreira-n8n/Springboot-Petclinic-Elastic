package org.springframework.samples.petclinic.repository.springdatajpa;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.context.annotation.Profile;
import org.springframework.samples.petclinic.model.Specialty;
import org.springframework.transaction.annotation.Transactional;

@Profile("spring-data-jpa")
public class SpringDataSpecialtyRepositoryImpl implements SpecialtyRepositoryOverride {

    @PersistenceContext
    private EntityManager em;

    @Transactional
    @Override
    public void delete(Specialty specialty) {
        Integer id = specialty.getId();

        // 1) Limpa a join table vet_specialties
        em.createNativeQuery("DELETE FROM vet_specialties WHERE specialty_id = :id")
          .setParameter("id", id)
          .executeUpdate();

        // 2) Apaga a Speciality com JPQL
        em.createQuery("DELETE FROM Specialty s WHERE s.id = :id")
          .setParameter("id", id)
          .executeUpdate();

        // 3) Sincroniza e limpa o contexto
        em.flush();
        em.clear();
    }
}
