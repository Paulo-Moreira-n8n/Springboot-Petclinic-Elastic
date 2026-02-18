package org.springframework.samples.petclinic.validation;

import co.elastic.apm.api.CaptureSpan;
import co.elastic.apm.api.ElasticApm;
import co.elastic.apm.api.Transaction;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ZipCodeValidator implements ConstraintValidator<ZipCodeConstraint,String> {


    private Pattern zipPattern;
    @Override
    public void initialize(ZipCodeConstraint constraintAnnotation) {
        // Aceita somente dígitos, com no mínimo 2
        this.zipPattern = Pattern.compile("^\\d{2,}$");
    }

    @CaptureSpan(value = "validateZipCode")
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        Matcher matcher = zipPattern.matcher(value);
        boolean match =  matcher.find();
        if (!match){
            Transaction transaction = ElasticApm.currentTransaction();
            if (transaction != null){
                transaction.captureException(new IllegalArgumentException(String.format("%s is invalid zip code",value)));
            }
        }
        return match;
    }
}
